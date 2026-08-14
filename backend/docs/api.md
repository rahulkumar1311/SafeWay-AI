# SafeWay-AI Backend API Documentation

Welcome to the **SafeWay-AI Backend API Specification**. This document provides detailed integration contracts for all backend endpoints prepared for frontend consumption.

---

## General Configuration & Principles

* **Base URL**: `http://localhost:5000/api`
* **Content-Type**: `application/json`
* **CORS**: Configured (`CORS_ORIGIN=*` in development mode)
* **Authentication**: Not implemented in MVP (No Auth tokens required)

### Standard Response Structure

#### Success Response Schema
```json
{
  "success": true,
  "message": "Optional operational message",
  "data": {} // or Array [...]
}
```

#### Error Response Schema
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

---

## Table of Contents
1. [System & Health](#1-system--health)
2. [Traffic Rules Module](#2-traffic-rules-module)
3. [Challan Fine Information Module](#3-challan-fine-information-module)
4. [Road Hazard Reporting Module](#4-road-hazard-reporting-module)
5. [Safety / Risk Analysis Module](#5-safety--risk-analysis-module)
6. [Emergency Assistance Module](#6-emergency-assistance-module)
7. [AI Integration Services](#7-ai-integration-services)

---

## 1. System & Health

### `GET /api/health`
* **Purpose**: Check backend server uptime, environment, and MongoDB database connectivity status.
* **Auth Requirement**: None
* **Request Parameters**: None
* **Request Body**: None

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "SafeWay-AI backend is running",
  "database": "connected"
}
```

---

## 2. Traffic Rules Module

### `GET /api/rules/:state`
* **Purpose**: Retrieve state-wise traffic rules with optional category/vehicle filtering and pagination.
* **Auth Requirement**: None
* **Path Parameters**:
  - `state` (string, required): State name (case-insensitive, e.g. `Bihar`, `bihar`).
* **Query Parameters**:
  - `category` (string, optional): Filter by rule category (e.g. `Helmet`, `Speeding`).
  - `vehicleType` (string, optional): Filter by vehicle type (`two-wheeler`, `four-wheeler`, `commercial`, `all`).
  - `page` (number, optional, default: `1`): Page number.
  - `limit` (number, optional, default: `20`, max: `100`): Results per page.

#### Example Request
`GET /api/rules/Bihar?category=Helmet&vehicleType=two-wheeler&page=1&limit=20`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a7e1824280e66cf69e46434",
      "state": "Bihar",
      "category": "Helmet",
      "title": "Riding Without Helmet",
      "description": "Riding a two-wheeler without a protective helmet",
      "vehicleType": "two-wheeler",
      "fineAmount": 1000,
      "sourceUrl": "https://transport.bihar.gov.in",
      "lastUpdated": "2026-08-13T19:16:52.427Z",
      "createdAt": "2026-08-13T19:16:52.443Z",
      "updatedAt": "2026-08-13T19:16:52.443Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "message": "State parameter is required"
}
```

---

### `POST /api/rules`
* **Purpose**: Ingest a new traffic rule entry (*Internal / Admin Endpoint*).
* **Auth Requirement**: None (Internal MVP)
* **Request Body**:
```json
{
  "state": "Bihar",
  "category": "Helmet",
  "title": "Riding Without Helmet",
  "description": "Riding a two-wheeler without a protective helmet",
  "vehicleType": "two-wheeler",
  "fineAmount": 1000,
  "sourceUrl": "https://transport.bihar.gov.in"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Traffic rule created successfully",
  "data": {
    "_id": "6a7e1824280e66cf69e46434",
    "state": "Bihar",
    "category": "Helmet",
    "title": "Riding Without Helmet",
    "description": "Riding a two-wheeler without a protective helmet",
    "vehicleType": "two-wheeler",
    "fineAmount": 1000,
    "sourceUrl": "https://transport.bihar.gov.in",
    "lastUpdated": "2026-08-13T19:16:52.427Z",
    "createdAt": "2026-08-13T19:16:52.443Z",
    "updatedAt": "2026-08-13T19:16:52.443Z"
  }
}
```

---

## 3. Challan Fine Information Module

### `GET /api/challans/:state`
* **Purpose**: Retrieve official state-wise fine and penalty information derived from traffic rules.
* **Auth Requirement**: None
* **Path Parameters**:
  - `state` (string, required): State name (case-insensitive).
* **Query Parameters**:
  - `category` (string, optional): Filter by category.
  - `vehicleType` (string, optional): Filter by vehicle type.
  - `page` (number, optional, default: `1`).
  - `limit` (number, optional, default: `20`).

#### Example Request
`GET /api/challans/Bihar`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "state": "Bihar",
  "data": [
    {
      "id": "6a7e1824280e66cf69e46434",
      "title": "Riding Without Helmet",
      "category": "Helmet",
      "vehicleType": "two-wheeler",
      "fineAmount": 1000,
      "description": "Riding a two-wheeler without a protective helmet",
      "sourceUrl": "https://transport.bihar.gov.in",
      "lastUpdated": "2026-08-13T19:16:52.427Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 4. Road Hazard Reporting Module

### `POST /api/hazards`
* **Purpose**: Submit a new road hazard report.
* **Auth Requirement**: None
* **Request Body**:
```json
{
  "type": "pothole",
  "description": "Large deep pothole near Gandhi Maidan intersection",
  "latitude": 25.61,
  "longitude": 85.14,
  "severity": "high"
}
```
* **Supported `type` values**: `pothole`, `accident`, `roadblock`, `waterlogging`, `construction`, `adverse_weather`, `animal_crossing`, `other`
* **Supported `severity` values**: `low`, `medium`, `high`, `critical` (default: `medium`)

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Road hazard reported successfully",
  "data": {
    "_id": "6a7e19480eca8f86f76f0f75",
    "type": "pothole",
    "description": "Large deep pothole near Gandhi Maidan intersection",
    "latitude": 25.61,
    "longitude": 85.14,
    "location": {
      "type": "Point",
      "coordinates": [85.14, 25.61]
    },
    "severity": "high",
    "status": "reported",
    "createdAt": "2026-08-13T19:21:44.531Z",
    "updatedAt": "2026-08-13T19:21:44.531Z"
  }
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Latitude must be a valid number between -90 and 90"
}
```

---

### `GET /api/hazards`
* **Purpose**: Retrieve a paginated list of reported road hazards.
* **Auth Requirement**: None
* **Query Parameters**:
  - `type` (string, optional)
  - `severity` (string, optional)
  - `status` (string, optional: `reported`, `verified`, `resolved`)
  - `page` (number, default: `1`)
  - `limit` (number, default: `20`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### `GET /api/hazards/nearby`
* **Purpose**: Geospatial search for road hazards within a radius using MongoDB `2dsphere` spatial indexing.
* **Auth Requirement**: None
* **Query Parameters**:
  - `latitude` (number, required): `-90` to `90`
  - `longitude` (number, required): `-180` to `180`
  - `radius` (number, optional, default: `5` km)

#### Example Request
`GET /api/hazards/nearby?latitude=25.61&longitude=85.14&radius=10`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6a7e19480eca8f86f76f0f75",
      "type": "pothole",
      "description": "Large deep pothole near Gandhi Maidan intersection",
      "latitude": 25.61,
      "longitude": 85.14,
      "location": {
        "type": "Point",
        "coordinates": [85.14, 25.61]
      },
      "severity": "high",
      "status": "reported"
    }
  ]
}
```

---

## 5. Safety / Risk Analysis Module

### `POST /api/safety/analyze`
* **Purpose**: Evaluate driving telemetry signals using a transparent rule-based risk engine.
* **Auth Requirement**: None
* **Request Body**:
```json
{
  "drowsinessScore": 75,
  "speed": 80,
  "speedLimit": 60,
  "harshBraking": 2,
  "roadHazard": true
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "riskLevel": "HIGH",
    "riskScore": 90,
    "reasons": [
      "High drowsiness detected",
      "Speed is significantly above the detected limit",
      "Harsh braking detected",
      "Road hazard reported nearby"
    ],
    "recommendations": [
      "Take a break immediately",
      "Reduce speed immediately",
      "Drive smoothly and avoid sudden stops",
      "Drive with caution and stay alert"
    ]
  }
}
```

---

## 6. Emergency Assistance Module

### `POST /api/emergency/contacts`
* **Purpose**: Register a new emergency contact for a user.
* **Request Body**:
```json
{
  "userId": "6a7e1a91c715143fca2624e4",
  "name": "Jane Doe",
  "phone": "+919876543210",
  "relationship": "Spouse"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Emergency contact created successfully",
  "data": {
    "_id": "6a7e1a91e6e324f36ce6a5fd",
    "userId": "6a7e1a91c715143fca2624e4",
    "name": "Jane Doe",
    "phone": "+919876543210",
    "relationship": "Spouse",
    "createdAt": "2026-08-13T19:27:13.086Z",
    "updatedAt": "2026-08-13T19:27:13.086Z"
  }
}
```

---

### `GET /api/emergency/contacts/:userId`
* **Purpose**: Retrieve all emergency contacts associated with a user ID.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6a7e1a91e6e324f36ce6a5fd",
      "userId": "6a7e1a91c715143fca2624e4",
      "name": "Jane Doe",
      "phone": "+919876543210",
      "relationship": "Spouse"
    }
  ]
}
```

---

### `PUT /api/emergency/contacts/:contactId`
* **Purpose**: Update an emergency contact's details.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Emergency contact updated successfully",
  "data": { ... }
}
```

---

### `DELETE /api/emergency/contacts/:contactId`
* **Purpose**: Delete an emergency contact.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Emergency contact deleted successfully"
}
```

---

### `POST /api/emergency/sos`
* **Purpose**: Process an emergency SOS alert.
* **Request Body**:
```json
{
  "userId": "6a7e1a91c715143fca2624e4",
  "latitude": 25.5941,
  "longitude": 85.1376,
  "eventType": "CRASH",
  "timestamp": "2026-08-13T19:27:13.169Z"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "SOS alert processed successfully",
  "data": {
    "sosId": "sos_1786649233175_24e4",
    "userId": "6a7e1a91c715143fca2624e4",
    "location": {
      "latitude": 25.5941,
      "longitude": 85.1376
    },
    "timestamp": "2026-08-13T19:27:13.169Z",
    "eventType": "CRASH",
    "contactsNotifiedCount": 1,
    "contacts": [
      {
        "id": "6a7e1a91e6e324f36ce6a5fd",
        "name": "Jane Doe",
        "phone": "+919876543210",
        "relationship": "Spouse"
      }
    ],
    "notification": {
      "sent": false,
      "status": "NOT_IMPLEMENTED_MVP",
      "message": "Real-time SMS/Call/WhatsApp notification delivery is not implemented in hackathon MVP",
      "targetContactsCount": 1,
      "timestamp": "2026-08-13T19:27:13.169Z"
    }
  }
}
```

---

## 7. AI Integration Services

### `POST /api/ai/drowsiness/analyze`
* **Purpose**: Proxy camera frame data to the Drowsiness Detection AI Inference Service.
* **Request Body**:
```json
{
  "sessionId": "session_abc123",
  "frameData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "drowsinessScore": 78,
    "isDrowsy": true,
    "confidence": 0.95,
    "timestamp": "2026-08-13T19:30:13.363Z"
  }
}
```

#### Service Unavailable Error (`503 Service Unavailable`)
```json
{
  "success": false,
  "message": "AI Drowsiness Inference Service is currently unavailable"
}
```

---

### `POST /api/ai/traffic-sign/analyze`
* **Purpose**: Proxy image data to the Traffic Sign Recognition AI Inference Service.
* **Request Body**:
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "signType": "STOP_SIGN",
    "meaning": "Stop completely before the stop line",
    "confidence": 0.96,
    "detectedAt": "2026-08-13T19:32:11.054Z"
  }
}
```

#### Service Unavailable Error (`503 Service Unavailable`)
```json
{
  "success": false,
  "message": "AI Traffic Sign Inference Service is currently unavailable"
}
```
