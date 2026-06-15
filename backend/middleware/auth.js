const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  try {

    const authHeader = req.header("Authorization");

    console.log("AUTH HEADER PRESENT:", !!authHeader);

    // No token
    if (!authHeader) {
      return res.status(401).send("No token");
    }

    // Remove Bearer
    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("AUTH VERIFIED userId:", verified.userId);

    req.userId = verified.userId;

    next();

  } catch (err) {

    console.log(err);

    res.status(401).send("Unauthorized");
  }
};