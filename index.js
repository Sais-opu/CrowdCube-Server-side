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
        // await client.db("admin").command({ ping: 1 });
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
            } catch (error) {
                console.error('Error processing donation:', error);
                res.status(500).json({ message: 'Error processing donation' });
            }
        })
        app.post('/campaigns', async (req, res) => {
            try {
                const { image, campaignTitle, campaignType, description, minimumDonationAmount, deadline, userEmail, userName } = req.body;
                const newCampaign = {
                    image,
                    campaignTitle,
                    campaignType,
                    description,
                    minimumDonationAmount,
                    deadline: new Date(deadline),
                    userEmail,
                    userName,
                    createdAt: new Date(),
                };

                const campaignsCollection = client.db('crowdcube').collection('campaign');
                const result = await campaignsCollection.insertOne(newCampaign);

                res.status(201).json({ message: 'Campaign added successfully', campaign: result.ops[0] });
            } catch (error) {
                console.error('Error adding campaign:', error);
                res.status(500).send({ message: 'Error adding campaign' });
            }
        });
        app.get('/myCampaign', async (req, res) => {
            try {
                const userEmail = req.query.userEmail; // Assume email is passed as a query param.
                if (!userEmail) {
                    return res.status(400).send({ message: 'User email is required' });
                }

                const campaignsCollection = client.db('crowdcube').collection('campaign');
                const userCampaigns = await campaignsCollection.find({ userEmail }).toArray();
                res.json(userCampaigns);
            } catch (error) {
                console.error('Error fetching user campaigns:', error);
                res.status(500).send({ message: 'Error fetching user campaigns' });
            }
        });
        app.delete('/campaigns/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const campaignsCollection = client.db('crowdcube').collection('campaign');
                const result = await campaignsCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 1) {
                    res.status(200).json({ message: 'Campaign deleted successfully' });
                } else {
                    res.status(404).json({ message: 'Campaign not found' });
                }
            } catch (error) {
                console.error('Error deleting campaign:', error);
                res.status(500).json({ message: 'Error deleting campaign' });
            }
        });
        // Update campaign by ID
        app.put('/campaign/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const updatedCampaign = req.body;

                const campaignsCollection = client.db('crowdcube').collection('campaign');
                const result = await campaignsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedCampaign }
                );

                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: 'Campaign updated successfully' });
                } else {
                    res.status(404).json({ message: 'Campaign not found or no changes made' });
                }
            } catch (error) {
                console.error('Error updating campaign:', error);
                res.status(500).json({ message: 'Error updating campaign' });
            }
        });
        // Route to fetch a specific campaign by ID
        app.get('/updateCampaign/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const campaignsCollection = client.db('crowdcube').collection('campaign');
                const campaign = await campaignsCollection.findOne({ _id: new ObjectId(id) });

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
