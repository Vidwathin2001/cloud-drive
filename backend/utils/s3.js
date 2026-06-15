const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: "eu-north-1"
});

exports.uploadFile = async (file) => {

  const params = {
    Bucket: process.env.BUCKET,

    Key: Date.now() + "-" + file.originalname,

    Body: file.buffer,

    ContentType: file.mimetype,

    // IMPORTANT
    ContentDisposition: "inline"
  };

  const data = await s3.upload(params).promise();

  return data.Location;
};