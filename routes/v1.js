import express from 'express';
import GenerateAudio from '../controller/v1/generateAudio';
import { deepStrictEqual } from 'assert';
var bodyParser = require('body-parser');
const router = express.Router();

router.get("/generateAudio", GenerateAudio.generateAudio);

export default router;