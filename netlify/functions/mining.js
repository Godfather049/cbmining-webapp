const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    const { userId, action } = JSON.parse(event.body);
    await client.connect();
    const db = client.db('cbank');
    const users = db.collection('users');

    if (action === 'start') {
      const endTime = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await users.updateOne(
        { userId },
        { $set: { miningEnd: endTime } },
        { upsert: true }
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, endTime })
      };
    } else if (action === 'check') {
      const user = await users.findOne({ userId });
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          active: user?.miningEnd > new Date(),
          endTime: user?.miningEnd
        })
      };
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  } finally {
    await client.close();
  }
};
