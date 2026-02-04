const { MongoClient } = require('mongodb');
const state = {
    db:null
}

module.exports.connect = async function(done){
    const url = 'mongodb://localhost:27017'
    const dbname = 'shopping'

    try {
        const client = new MongoClient(url); // no extra options needed now
        await client.connect();
        state.db = client.db(dbname);
        done();
      } catch (err) {
        done(err);
      }
     
}

module.exports.get = function(){
    return state.db
}