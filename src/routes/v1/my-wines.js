const express = require("express");
const mysql = require("mysql2/promise");

const validation = require("../../middleware/validation");
const { mysqlConfig } = require("../../config");
const { isLoggedIn } = require("../../middleware/auth");
const { collectionSchema } = require("../../middleware/schemas");

const router = express.Router();

const status500 = "An issue occured. Please, try again later.";

router.get("/", isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      SELECT * 
        FROM collections
       WHERE user_id = ${req.user.accountId}
    `);
    await con.end();

    return res.send(data);
  } catch (err) {
    res.status(500).send({ err: status500 });
  }
});

router.post("/", isLoggedIn, validation(collectionSchema), async (req, res) => {
  // find user's collection by given wine id and user id
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      SELECT * 
        FROM collections
       WHERE user_id = ${req.user.accountId}
         AND wine_id = ${mysql.escape(req.body.wine_id)}
    `);

    // if no data found - a new collection is added to the database
    if (data.length === 0) {
      // if user tries to lower amount of non existing collection - return error
      if (req.body.amount < 0) {
        return res.status(400).send({ err: "Not enough wine in collection" });
      }

      const [response] = await con.execute(`
        INSERT INTO collections (wine_id, user_id, quantity)
        VALUES (${mysql.escape(req.body.wine_id)},
                ${req.user.accountId},
                ${mysql.escape(req.body.amount)})
      `);

      if (!response.insertId) {
        return res.status(500).send({ err: status500 });
      }

      await con.end();
      return res.send({
        msg: "Successfully added a wine to collection",
        id: response.insertId,
      });

      // if user's collection was found - update it with a given amount
    } else {
      // if collection exists, but user tries to subtract more than the quantity - return error
      if (data[0].quantity + req.body.amount < 0) {
        return res.status(400).send({ err: "Not enough wine in collection" });
      }

      const quantity = data[0].quantity + req.body.amount;
      const [response] = await con.execute(`
        UPDATE collections 
           SET quantity = ${quantity} 
         WHERE wine_id = ${mysql.escape(req.body.wine_id)}
           AND user_id = ${req.user.accountId}
      `);

      if (!response.affectedRows) {
        return res.status(500).send({ err: status500 });
      }

      await con.end();
      return res.send({
        msg: "Successfully updated wine quantity",
      });
    }
  } catch (err) {
    res.status(500).send({ err: status500 });
  }
});

module.exports = router;
