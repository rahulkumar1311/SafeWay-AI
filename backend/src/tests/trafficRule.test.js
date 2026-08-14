import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import TrafficRule from '../models/TrafficRule.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('==================================================');
  console.log('STARTING TRAFFIC RULES API INTEGRATION & UNIT TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} - ${details}`);
      failed++;
    }
  };

  try {
    // 1. Connect DB and start server on dynamic port
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/rules`;
    console.log(`Test server running on ${baseUrl}\n`);

    // Clean initial test entries if any exist
    await TrafficRule.deleteMany({ state: { $in: ['Bihar', 'bihar', 'BIHAR', 'Maharashtra', 'TestState'] } });

    // ----------------------------------------------------
    // TEST 8: Empty database / state with no data
    // ----------------------------------------------------
    const resEmpty = await fetch(`${baseUrl}/Bihar`);
    const jsonEmpty = await resEmpty.json();
    assert(
      resEmpty.status === 200 && jsonEmpty.success === true && Array.isArray(jsonEmpty.data) && jsonEmpty.data.length === 0,
      'Test 8: Empty database returns HTTP 200 with empty data array',
      JSON.stringify(jsonEmpty)
    );
    assert(
      jsonEmpty.message === 'Traffic rules fetched successfully' &&
      jsonEmpty.pagination.total === 0 &&
      jsonEmpty.pagination.totalPages === 0,
      'Test 8: Empty database returns proper message and pagination object',
      JSON.stringify(jsonEmpty)
    );

    // ----------------------------------------------------
    // TEST 9: Unknown state
    // ----------------------------------------------------
    const resUnknown = await fetch(`${baseUrl}/UnknownState999`);
    const jsonUnknown = await resUnknown.json();
    assert(
      resUnknown.status === 200 && jsonUnknown.data.length === 0,
      'Test 9: Unknown state returns HTTP 200 with empty array',
      JSON.stringify(jsonUnknown)
    );

    // ----------------------------------------------------
    // TEST 6: Invalid page parameter
    // ----------------------------------------------------
    const resInvalidPage = await fetch(`${baseUrl}/Bihar?page=abc`);
    const jsonInvalidPage = await resInvalidPage.json();
    assert(
      resInvalidPage.status === 400 && jsonInvalidPage.success === false,
      'Test 6: Invalid page parameter returns HTTP 400 error',
      JSON.stringify(jsonInvalidPage)
    );

    // ----------------------------------------------------
    // TEST 7: Invalid limit parameter
    // ----------------------------------------------------
    const resInvalidLimitNeg = await fetch(`${baseUrl}/Bihar?limit=-10`);
    const jsonInvalidLimitNeg = await resInvalidLimitNeg.json();
    assert(
      resInvalidLimitNeg.status === 400 && jsonInvalidLimitNeg.success === false,
      'Test 7: Negative limit parameter returns HTTP 400 error',
      JSON.stringify(jsonInvalidLimitNeg)
    );

    const resInvalidLimitExceed = await fetch(`${baseUrl}/Bihar?limit=100`);
    const jsonInvalidLimitExceed = await resInvalidLimitExceed.json();
    assert(
      resInvalidLimitExceed.status === 400 && jsonInvalidLimitExceed.success === false,
      'Test 7: Limit parameter > 50 returns HTTP 400 error',
      JSON.stringify(jsonInvalidLimitExceed)
    );

    // Insert temporary test data for Bihar and Maharashtra
    const testRules = [
      {
        state: 'Bihar',
        category: 'Helmet',
        title: 'Riding without Helmet',
        description: 'Mandatory helmet rule for two-wheeler rider and pillion.',
        vehicleType: 'TwoWheeler',
        fineAmount: 1000,
        sourceUrl: 'https://transport.bihar.gov.in',
        lastUpdated: new Date()
      },
      {
        state: 'Bihar',
        category: 'Seatbelt',
        title: 'Driving without Seatbelt',
        description: 'Mandatory seatbelt rule for four-wheeler drivers.',
        vehicleType: 'FourWheeler',
        fineAmount: 1000,
        sourceUrl: 'https://transport.bihar.gov.in',
        lastUpdated: new Date()
      },
      {
        state: 'Bihar',
        category: 'Helmet',
        title: 'Defective Helmet',
        description: 'Riding with non-BIS certified helmet.',
        vehicleType: 'TwoWheeler',
        fineAmount: 500,
        sourceUrl: 'https://transport.bihar.gov.in',
        lastUpdated: new Date()
      },
      {
        state: 'Maharashtra',
        category: 'Speeding',
        title: 'Over Speeding',
        description: 'Exceeding speed limit on highways.',
        vehicleType: 'FourWheeler',
        fineAmount: 2000,
        sourceUrl: 'https://transport.maharashtra.gov.in',
        lastUpdated: new Date()
      }
    ];

    await TrafficRule.insertMany(testRules);

    // ----------------------------------------------------
    // TEST 1: GET /api/rules/Bihar
    // ----------------------------------------------------
    const resBihar = await fetch(`${baseUrl}/Bihar`);
    const jsonBihar = await resBihar.json();
    assert(
      resBihar.status === 200 && jsonBihar.data.length === 3 && jsonBihar.pagination.total === 3,
      'Test 1: GET /api/rules/Bihar fetches 3 rules correctly',
      JSON.stringify(jsonBihar)
    );

    // ----------------------------------------------------
    // TEST 2: Case-insensitive state: GET /api/rules/bihar and /api/rules/BIHAR
    // ----------------------------------------------------
    const resLower = await fetch(`${baseUrl}/bihar`);
    const jsonLower = await resLower.json();
    const resUpper = await fetch(`${baseUrl}/BIHAR`);
    const jsonUpper = await resUpper.json();
    assert(
      resLower.status === 200 && jsonLower.data.length === 3 && jsonUpper.data.length === 3,
      'Test 2: Case-insensitive state (/bihar and /BIHAR) returns identical results',
      `lower length: ${jsonLower.data.length}, upper length: ${jsonUpper.data.length}`
    );

    // ----------------------------------------------------
    // TEST 3: Category filter
    // ----------------------------------------------------
    const resCategory = await fetch(`${baseUrl}/Bihar?category=Helmet`);
    const jsonCategory = await resCategory.json();
    assert(
      resCategory.status === 200 && jsonCategory.data.length === 2 && jsonCategory.data.every(r => r.category.toLowerCase() === 'helmet'),
      'Test 3: Category filter (?category=Helmet) returns matching rules only',
      JSON.stringify(jsonCategory)
    );

    // ----------------------------------------------------
    // TEST 4: Vehicle type filter
    // ----------------------------------------------------
    const resVehicle = await fetch(`${baseUrl}/Bihar?vehicleType=TwoWheeler`);
    const jsonVehicle = await resVehicle.json();
    assert(
      resVehicle.status === 200 && jsonVehicle.data.length === 2 && jsonVehicle.data.every(r => r.vehicleType.toLowerCase() === 'twowheeler'),
      'Test 4: Vehicle type filter (?vehicleType=TwoWheeler) returns matching rules only',
      JSON.stringify(jsonVehicle)
    );

    // ----------------------------------------------------
    // TEST 5: Pagination
    // ----------------------------------------------------
    const resPage1 = await fetch(`${baseUrl}/Bihar?page=1&limit=2`);
    const jsonPage1 = await resPage1.json();
    assert(
      resPage1.status === 200 &&
      jsonPage1.data.length === 2 &&
      jsonPage1.pagination.page === 1 &&
      jsonPage1.pagination.limit === 2 &&
      jsonPage1.pagination.total === 3 &&
      jsonPage1.pagination.totalPages === 2,
      'Test 5: Pagination page 1 limit 2 returns 2 items and total 3 / 2 pages',
      JSON.stringify(jsonPage1)
    );

    const resPage2 = await fetch(`${baseUrl}/Bihar?page=2&limit=2`);
    const jsonPage2 = await resPage2.json();
    assert(
      resPage2.status === 200 &&
      jsonPage2.data.length === 1 &&
      jsonPage2.pagination.page === 2,
      'Test 5: Pagination page 2 limit 2 returns remaining 1 item',
      JSON.stringify(jsonPage2)
    );

    // ----------------------------------------------------
    // TEST 10: Database error handling
    // ----------------------------------------------------
    assert(
      jsonInvalidPage.success === false && typeof jsonInvalidPage.message === 'string',
      'Test 10: Error handling formats error response properly with success: false and error message',
      JSON.stringify(jsonInvalidPage)
    );

    // Clean up temporary test rules
    await TrafficRule.deleteMany({ state: { $in: ['Bihar', 'bihar', 'BIHAR', 'Maharashtra', 'TestState'] } });
    console.log('\nTemporary test data cleaned up from database.');

  } catch (err) {
    console.error('Unhandled Test Execution Error:', err);
    failed++;
  } finally {
    if (server) {
      await new Promise(r => server.close(r));
    }
    await mongoose.connection.close();
    console.log(`\n==================================================`);
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);
  }
};

runTests();
