exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const userId = event.queryStringParameters.userId;

  return {
    statusCode: 200,
    body: JSON.stringify({
      referralLink: `https://t.me/cbmining_bot?start=ref${userId}`
    })
  };
};
