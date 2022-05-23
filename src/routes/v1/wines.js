const express = require("express");
const mysql = require("mysql2/promise");

const validation = require("../../middleware/validation");
const { mysqlConfig } = require("../../config");
const { isLoggedIn } = require("../../middleware/auth");
const { wineSchema } = require("../../middleware/schemas");

const router = express.Router();

const status500 = "An issue occured. Please, try again later.";

router.get("/", isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      SELECT * FROM wines
    `);
    await con.end();

    return res.send(data);
  } catch (err) {
    res.status(500).send({ err: status500 });
  }
});

router.post("/", isLoggedIn, validation(wineSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      INSERT INTO wines (title, region, year) 
      VALUES (${mysql.escape(req.body.title)}, 
              ${mysql.escape(req.body.region)}, 
              ${mysql.escape(req.body.year)})
    `);

    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ err: status500 });
    }

    return res.send({
      msg: "Successfully added a wine",
      id: data.insertId,
    });
  } catch (err) {
    return res.status(500).send({ err: status500 });
  }
});

module.exports = router;
