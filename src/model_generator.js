"use strict";

const fs = require("fs");
const path = require("path");
const { getMetaData } = require("./get_metadata");

getMetaData().then((data) => {

  var jsonSchema = JSON.parse(data);

  const parseRelationshipArg = (fields) => {
    fields = fields == "_id" ? "id" : fields;
    return "[" + fields + "]";
  };

  const parseRelationship = (modelname, field, relationships) => {
    var relationshipString = "";
    if (!relationships) {
      return "";
    }
    relationships.map(
      ({ entity, sourceColumn, targetColumn, target_entity }) => {
        const relationName = `name: "${entity}_${sourceColumn}_${target_entity}_${targetColumn}"`;
        if (entity == modelname) {
          if (field == sourceColumn) {
            const relationField = target_entity;
            const relationType = target_entity;

            const relationFields = `fields: ${parseRelationshipArg(
              sourceColumn
            )}, `;
            const relationReferences = `references: ${parseRelationshipArg(
              targetColumn
            )}`;

            relationshipString = ` ${target_entity} ${relationType} @relation(${relationName}, ${relationFields}${relationReferences})`;
          }
        } else if (modelname == target_entity) {
          if (field == targetColumn) {
            relationshipString =
              relationshipString == ""
                ? `${entity}_FK ${entity}[] @relation(${relationName})`
                : relationshipString +
                  `\n ${entity}_FK ${entity}[] @relation(${relationName})`;
          }
        }
      }
    );

    return relationshipString;
  };

  const parseModelFields = (modelname, fields, relationships) => {
    return fields.map(({ name, properties }) => {
      if (name == "_id") return null;

      const relationship = parseRelationship(modelname, name, relationships);

      const autoIncrement =
        (name == "id") | (name == "Id") ? "@id @default(autoincrement())" : "";

      const type =
        properties.datatype == "string"
          ? "String"
          : properties.datatype === "number"
          ? "Int"
          : properties.datatype === "integer"
          ? "Int"
          : properties.datatype === "boolean"
          ? "Boolean"
          : properties.datatype === "datetime"
          ? "DateTime"
          : properties.datatype === "date"
          ? "DateTime @db.Date"
          : properties.datatype === "object"
          ? "String"
          : properties.datatype === "dimension"
          ? "String"
          : properties.datatype === "array"
          ? "Int"
          : "Unsupported";

      return relationship != ""
        ? `    ${name} ${type} ${autoIncrement} \n   ${relationship}`
        : `    ${name} ${type} ${autoIncrement}`;
    });
  };

  const parseModels = (models, relationships) => {
    return models.reduce((a, { entity, fields, ...rest }) => {
      return [
        ...a,
        `model ${entity} {`,
        ...parseModelFields(entity, fields, relationships),
        "}",
        "",
        "",
      ];
    }, []);
  };

  const parseEnumFields = (fields) => {
    return fields.map((field) => `  ${field}`);
  };

  const parseEnums = (enums) => {
    return enums.reduce((a, { name, fields }) => {
      return [...a, `enum ${name} {`, ...parseEnumFields(fields), "}"];
    }, []);
  };

  const prismaSchema = Object.entries(jsonSchema.Result).reduce(
    (a, [type, values]) => {
      if (type === "metadata") {
        return [
          ...a,
          ...parseModels(values, jsonSchema.Result.entity_relationship),
        ];
      }

      if (type === "enums") {
        return [...a, ...parseEnums(values)];
      }

      return a;
    },
    []
  );

  fs.appendFileSync("./prisma/schema.prisma", prismaSchema.join("\n"));
});

