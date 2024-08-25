import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
});

const s3 = new AWS.S3();

export const checkFileExists = async (bucketName, fileName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound' || error.statusCode === 404) {
      return false;
    } else {
      // Log other errors
      console.error('Error checking file existence:', error);
      return false;
    }
  }
};

export const listAllFiles = async (bucketName, folderName) => {
  const params = {
    Bucket: bucketName,
    Prefix: folderName,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map((item) => item.Key);
  } catch (error) {
    throw error;
  }
};

export const downloadS3File = async (bucketName, fileName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    const data = await s3.getObject(params).promise();
    return data;
  } catch (error) {
    throw error;
  }
};

export const removeS3File = async (bucketName, fileName) => {
  console.log('Removing file:', fileName);

  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log('File removed:', fileName);
  } catch (error) {
    throw error;
  }
};
