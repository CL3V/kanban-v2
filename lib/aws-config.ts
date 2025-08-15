import { S3Client } from "@aws-sdk/client-s3";

const awsConfig = {
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

export const s3Client = new S3Client(awsConfig);

export const S3_BUCKET_NAME =
  process.env.S3_BUCKET_NAME || "kanban-app-data-cl3v";

export const S3_KEYS = {
  BOARDS: "boards/",
  TASKS: "tasks/",
  BOARD_LIST: "board-list.json",
} as const;
