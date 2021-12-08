"use strict";

const fs = require("fs");
const path = require("path");
const { getMetaData } = require("./get_metadata");

function validataFieldName(fieldname, entityname) {
  return fieldname == "_id" ? entityname + "_id" : fieldname;
}

function validateDataType(name, datatype) {
  var type = "";
  return type =
    name == "_id"
      ? "String"
      : datatype == "string"
        ? "String"
        : datatype === "number"
          ? "Int"
          : datatype === "integer"
            ? "Int"
            : datatype === "boolean"
              ? "Boolean"
              : datatype === "datetime"
                ? "DateTime"
                : datatype === "date"
                  ? "DateTime"
                  : datatype === "object"
                    ? "String"
                    : datatype === "dimension"
                      ? "String"
                      : datatype === "array"
                        ? "String"
                        : "Unsupported";
}

function validateAttributes(fieldname) {
  return fieldname == "_id" ? "@id" : "";
}

function validateRelationships(modelName, fieldName, entityRelationships) {
  var relationshipString = "";

  for (var i = 0; i < entityRelationships.length; i++) {
    const sourceEntity = entityRelationships[i].entity_objectname;
    const sourceColumn = entityRelationships[i].sourceColumn;
    const targetEntity = entityRelationships[i].target_entity_objectname;
    const targetColumn = entityRelationships[i].targetColumn;

    const relationName = `name: "${sourceEntity}-${sourceColumn}_${targetEntity}-${targetEntity}_id"`;
    const relationFields = `fields: [${sourceColumn}], `;
    const relationReferences = `references: [${targetEntity}_id]`;

    if (modelName == sourceEntity) {
      if (fieldName == sourceColumn) {
        relationshipString = `${targetEntity}_${sourceColumn} ${targetEntity} @relation(${relationName}, ${relationFields}${relationReferences})`;
      }
    } else if (modelName == targetEntity) {
      if (fieldName == targetColumn) {
        relationshipString = `${sourceEntity}_FK ${sourceEntity}[] @relation(${relationName})`;
      }
    }
  }
  return relationshipString;
}

getMetaData().then((response) => {
  var modelString = "";
  const metaData = response.data.Result.metadata;
  const entityRelationships = response.data.Result.entity_relationship;

  for (var i = 0; i < metaData.length; i++) {
    const modelName = metaData[i].entity;
    const fields = metaData[i].fields;

    modelString = `${modelString}model ${modelName}{\n`;

    for (var j = 0; j < fields.length; j++) {
      var fieldName = fields[j].name;
      var fieldDataType = fields[j].properties.datatype;

      var name = validataFieldName(fieldName, modelName);
      var type = validateDataType(fieldName, fieldDataType);
      var attributes = validateAttributes(fieldName);
      var relationships = validateRelationships(
        modelName,
        fieldName,
        entityRelationships
      );

      modelString =
        relationships == ""
          ? `${modelString} ${name} ${type} ${attributes}\n`
          : `${modelString} ${name} ${type} ${attributes}\n ${relationships}\n`;
    }
    modelString = `${modelString}}\n`;
  }

  fs.writeFileSync("./prisma/schema.prisma", "");
  fs.writeFileSync("./prisma/schema.prisma",fs.readFileSync("./prisma/generator_schema.prisma"));

  fs.appendFile("./prisma/schema.prisma", modelString, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
});

