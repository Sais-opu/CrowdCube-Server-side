const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection setup
const uri = `mongodb+srv://${(process.env.DB_user)}:${(process.env.DB_pass)}@cluster0.ih9r7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectMongoDB() {
    try {
        // Connect the client to the server
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const campaignsCollection = client.db('crowdcube').collection('campaign');
        app.get('/running-campaigns', async (req, res) => {
            try {
                const currentDate = new Date();
                const runningCampaigns = await campaignsCollection.find({}).limit(6).toArray();
                const dateFilter = runningCampaigns.filter((item) => {
                    console.log(new Date(item.deadline))
                    return new Date(item.deadline) > currentDate

                })
                console.log(runningCampaigns.length, dateFilter.length)

                // console.log('Running campaigns:', runningCampaigns);  
                res.json(runningCampaigns);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
                res.status(500).send({ message: 'Error fetching campaigns' });
            }
        });
        // Route to fetch all campaigns
        app.get('/campaigns', async (req, res) => {
            try {
                const campaigns = await campaignsCollection.find({}).toArray();
                res.json(campaigns);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
                res.status(500).send({ message: 'Error fetching campaigns' });
            }
        });
        // Route to fetch details of a specific campaign by ID
        app.get('/campaign/:id', async (req, res) => {
            try {
                const campaign = await campaignsCollection.findOne({ _id: new ObjectId(req.params.id) });
                if (campaign) {
                    res.json(campaign);
                } else {
                    res.status(404).send({ message: 'Campaign not found' });
                }
            } catch (error) {
                console.error('Error fetching campaign details:', error);
                res.status(500).send({ message: 'Error fetching campaign details' });
            }
        });
        app.post('/donate', async (req, res) => {
            try {
                const { campaignId, userEmail, userName } = req.body;
                
                // Insert the donation data into the 'donated' collection
                const donationsCollection = client.db('crowdcube').collection('donated');
                const donationData = {
                    campaignId: new ObjectId(campaignId),
                    userEmail,
                    userName,
                    donatedAt: new Date(),
                };
        
                await donationsCollection.insertOne(donationData);
                console.log('Donation received:', campaignId, userEmail, userName);
                res.status(201).json({ message: 'Donation successful' });
            }catch (error) {
                console.error('Error processing donation:', error);
                res.status(500).json({ message: 'Error processing donation' });
            }
        })


        // Test route to check server status
        app.get('/', (req, res) => {
            res.send('Server is running');
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);  // Exit process if the connection fails
    }
}

connectMongoDB();
