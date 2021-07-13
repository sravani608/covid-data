const express = require("express");
const { open } = require("sqlite");
const sqlite = require("sqlite3");
const path = require("path");

const db_path = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializeAndStartServer = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};

initializeAndStartServer();

convertDBObjectToResponseObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const get_states = `
        SELECT *
        FROM state;`;

  const states = await db.all(get_states);
  response.send(
    states.map((each_state) => convertDBObjectToResponseObj(each_state))
  );
});

app.get("/states/:stateId/",async (request,response)=>{
    const {stateId}=request.params;
    const get_state=`
        SELECT *
        FROM state
        WHERE state_id=${stateId};`;

    const state=await db.get(get_state);
    response.send(convertDBObjectToResponseObj(state));
});

app.post("/districts/",async (request,response)=>{
    const {districtName,stateId,cases,cured,active,deaths}=request.body;

    const post_query=`
    INSERT INTO district
        (district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
    
    const posted_data=await db.run(post_query);
    response.send("District Successfully Added");
});

app.get("/districts/:districtId/",async (request,response)=>{
    const {districtId}=request.params;
    const get_district=`
    SELECT *
    FROM district
    WHERE district_id=${districtId};`;

    const district=await db.get(get_district);
    response.send(convertDistrictDbObjectToResponseObject(district));
});

app.delete("/districts/:districtId/",async (request,response)=>{
    const {districtId}=request.params;
    const delete_district=`
    DELETE FROM district
    WHERE district_id=${districtId};`;

    await db.run(delete_district);
    response.send("District Removed");
})

app.put("/districts/:districtId/",async (request,response)=>{
    const {districtName,stateId,cases,cured,active,deaths}=request.body;
    const {districtId}=request.params;

    const put_query=`
    UPDATE district
    SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE district_id=${districtId}`;

    await db.run(put_query);
    response.send("District Details Updated");
});

app.get("/states/:stateId/stats/",async(request,response)=>{
    const {stateId}=request.params;
    const details=`
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM state
    WHERE state_id=${stateId};`;

    const stats=await db.get(details);
    response.send({
        totalCases:stats["SUM(cases)"],
        totalCured:stats["SUM(cured)"],
        totalActive:stats["SUM(active)"],
        totalDeaths:stats["SUM(deaths)"]
    });
});

app.get("/districts/:districtId/details/",(request,response)=>{
    const {districtId}=request.params;
    const state_names=`
    SELECT state_name
    FROM state
        INNER JOIN district
        ON state.state_id=district.state_id
    WHERE district_id=${districtId};`;

    const state=await db.get(state_names);
    response.send({stateName:state.state_name});
});

module.exports=app;