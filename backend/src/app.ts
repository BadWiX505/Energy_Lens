import morgan from 'morgan';
import express from 'express';
import cors from 'cors';
import { eventBus } from './events/eventBus';
import dotenv from 'dotenv';
dotenv.config();
import {client} from './common/mqtt/mqtt.client';
const app = express();

// console.log('MQTT Client initialized:', client ? 'Success' : 'Failed to initialize MQTT client');
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

export default app;