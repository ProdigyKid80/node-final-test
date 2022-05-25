const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");

const { mysqlConfig, jwtSecret } = require("../../config");
const { isLoggedIn } = require("../../middleware/auth");
const {
  registrationSchema,
  loginSchema,
  changePasswordSchema,
} = require("../../middleware/schemas");
const validation = require("../../middleware/validation");

const router = express.Router();

const status500 = "An issue occured. Please, try again later.";

router.post("/register", validation(registrationSchema), async (req, res) => {
  try {
    const hash = bcrypt.hashSync(req.body.password, 15);

    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      INSERT INTO users (name, email, password)
      VALUES (${mysql.escape(req.body.name)}, 
              ${mysql.escape(req.body.email)}, 
              '${hash}')
    `);

    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ err: status500 });
    }

    return res.send({
      msg: "Successfully created a user account",
      accountId: data.insertId,
    });
  } catch (err) {
    return res.status(500).send({ err: status500 });
  }
});

router.post("/login", validation(loginSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      SELECT *
        FROM users
       WHERE email = ${mysql.escape(req.body.email)}
       LIMIT 1
    `);

    await con.end();

    if (data.length === 0) {
      return res.status(400).send({ err: "User not found" });
    }

    if (!bcrypt.compareSync(req.body.password, data[0].password)) {
      return res.status(400).send({ err: "Entered password is incorrect" });
    }

    const token = jsonwebtoken.sign({ accountId: data[0].id }, jwtSecret);

    return res.send({
      msg: "Successfully logged in",
      token,
    });
  } catch (err) {
    return res.status(500).send({ err: status500 });
  }
});

router.post(
  "/change-password",
  isLoggedIn,
  validation(changePasswordSchema),
  async (req, res) => {
    try {
      const con = await mysql.createConnection(mysqlConfig);
      const [data] = await con.execute(`
        SELECT *
          FROM users
         WHERE id = ${req.user.accountId}
      `);

      await con.end();

      if (data.length === 0) {
        return res.status(400).send({ err: "User not found" });
      }

      if (!bcrypt.compareSync(req.body.oldPassword, data[0].password)) {
        return res.status(400).send({ err: "Old password is incorrect" });
      }
    } catch (err) {
      return res.status(500).send({ err: status500 });
    }

    try {
      const hash = bcrypt.hashSync(req.body.newPassword, 15);

      const con = await mysql.createConnection(mysqlConfig);
      const [response] = await con.execute(`
        UPDATE users SET PASSWORD = '${hash}' WHERE id = ${req.user.accountId}
      `);

      await con.end();

      if (!response.affectedRows) {
        return res.status(500).send({ err: status500 });
      }

      return res.send({
        msg: "Successfully changed password",
      });
    } catch (err) {
      return res.status(500).send({ err: status500 });
    }
  }
);

module.exports = router;
