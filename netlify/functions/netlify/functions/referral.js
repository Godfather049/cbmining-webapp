exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { userId, referrerId } = JSON.parse(event.body);
  
  // MongoDB əməliyyatları
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('cbank');
    const users = db.collection('users');

    // Referrer-ə bonus ver
    await users.updateOne(
      { userId: referrerId },
      { $inc: { referrals: 1, balance: 50 } }
    );

    // Yeni istifadəçiyə bonus ver
    await users.updateOne(
      { userId },
      { $setOnInsert: { balance: 100 } },
      { upsert: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  } finally {
    await client.close();
  }
};
