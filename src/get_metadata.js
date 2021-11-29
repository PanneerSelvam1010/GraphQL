var axios = require("axios");

var data = JSON.stringify({
  filter: {
    columname: "metadataId",
    operator: "equals",
    value: "7fba5eb0-c709-4f16-9b89-eff446d56306",
  },
});

var config = {
  method: "post",
  url: "https://arangodbservice.sit.ainqaplatform.in/api/get_schema",
  headers: {
    "Content-Type": "application/json",
  },
  data: data,
};

exports.getMetaData = async () => {
  try {
    const response = await axios(config);
    if (response.status === 200) {
      return JSON.stringify(response.data);
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
};
