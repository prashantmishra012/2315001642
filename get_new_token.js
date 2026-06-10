const axios = require('axios');
const payload = {
  email: 'prashant.mishra_cs23@gla.ac.in',
  name: 'prashant kumar mishra',
  rollNo: '2315001642',
  accessCode: 'RPsgYt',
  clientID: '9a55109d-ebc6-4dc4-8fc0-96f77a164219',
  clientSecret: 'NyjgsHrRrmjePftW'
};

async function fetchToken(name) {
  try {
    const res = await axios.post('http://4.224.186.213/evaluation-service/auth', { ...payload, name });
    console.log("SUCCESS");
    console.log(res.data.access_token);
    return true;
  } catch (e) {
    console.log("FAILED for name:", name);
    console.log(e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
    return false;
  }
}

async function main() {
  let ok = await fetchToken('prashant kumar mishra');
  if (!ok) {
    await fetchToken('Prashant Kumar Mishra');
  }
}
main();
