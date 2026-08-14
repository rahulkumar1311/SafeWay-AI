import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import EmergencyContact from '../models/EmergencyContact.js';

const runEmergencyTests = async () => {
  console.log('==================================================');
  console.log('STARTING EMERGENCY & NOTIFICATION MODULE TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;
  let server;

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
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/emergency`;

    const testUserId = 'test_user_emg_999';
    await EmergencyContact.deleteMany({ userId: testUserId });

    // ----------------------------------------------------
    // TEST 1, 14: Valid Emergency Contact Creation & Persistence
    // ----------------------------------------------------
    const validContactPayload = {
      userId: testUserId,
      name: 'John Emergency',
      phone: '+919876543210',
      relationship: 'Father'
    };

    const resCreate = await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validContactPayload)
    });
    const jsonCreate = await resCreate.json();

    assert(
      resCreate.status === 201 && jsonCreate.success === true && Boolean(jsonCreate.data._id),
      'Test 1: Valid emergency contact creation returns 201 Created with valid ID',
      JSON.stringify(jsonCreate)
    );

    const createdContactId = jsonCreate.data._id;
    const dbContact = await EmergencyContact.findById(createdContactId);
    assert(
      dbContact !== null && dbContact.name === 'John Emergency' && dbContact.phone === '+919876543210',
      'Test 14: EmergencyContact document verified persisted in MongoDB database',
      JSON.stringify(dbContact)
    );

    // ----------------------------------------------------
    // TEST 2: Required phone validation
    // ----------------------------------------------------
    const resMissingPhone = await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId, name: 'No Phone', relationship: 'Friend' })
    });
    assert(resMissingPhone.status === 400, 'Test 2: Missing phone field rejects with HTTP 400');

    // ----------------------------------------------------
    // TEST 3: Required relationship validation
    // ----------------------------------------------------
    const resMissingRel = await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId, name: 'No Rel', phone: '+919876543210' })
    });
    assert(resMissingRel.status === 400, 'Test 3: Missing relationship field rejects with HTTP 400');

    // ----------------------------------------------------
    // TEST 4: Invalid phone format rejection
    // ----------------------------------------------------
    const resInvalidPhone = await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validContactPayload, phone: 'invalid-phone-xyz' })
    });
    assert(resInvalidPhone.status === 400, 'Test 4: Rejects invalid phone format with HTTP 400');

    // ----------------------------------------------------
    // TEST 5 & 6: Contact Retrieval & Multiple Contacts
    // ----------------------------------------------------
    await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        name: 'Jane Emergency',
        phone: '+919123456789',
        relationship: 'Mother'
      })
    });

    const resGet = await fetch(`${baseUrl}/contacts/${testUserId}`);
    const jsonGet = await resGet.json();
    assert(
      resGet.status === 200 && jsonGet.count === 2 && jsonGet.data.length === 2,
      'Test 5 & 6: Contact retrieval returns all 2 emergency contacts for user',
      JSON.stringify(jsonGet)
    );

    // ----------------------------------------------------
    // TEST 7: Invalid ObjectId for update/delete
    // ----------------------------------------------------
    const resInvalidId = await fetch(`${baseUrl}/contacts/invalid_contact_id`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    assert(resInvalidId.status === 400, 'Test 7: Rejects malformed contactId format with HTTP 400');

    // ----------------------------------------------------
    // TEST 8: Nonexistent contact ID
    // ----------------------------------------------------
    const fakeValidId = new mongoose.Types.ObjectId().toString();
    const resNotFound = await fetch(`${baseUrl}/contacts/${fakeValidId}`, {
      method: 'DELETE'
    });
    assert(resNotFound.status === 404, 'Test 8: Nonexistent contactId returns HTTP 404 Not Found');

    // ----------------------------------------------------
    // TEST 9 & 11: Emergency Trigger (SOS) & Notification Service Behavior
    // ----------------------------------------------------
    const sosPayload = {
      userId: testUserId,
      latitude: 25.61,
      longitude: 85.14,
      eventType: 'CRASH'
    };

    const resSOS = await fetch(`${baseUrl}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sosPayload)
    });
    const jsonSOS = await resSOS.json();

    assert(
      resSOS.status === 200 &&
      jsonSOS.success === true &&
      jsonSOS.data.contactsNotifiedCount === 2 &&
      jsonSOS.data.notification.status === 'NOT_IMPLEMENTED_MVP',
      'Test 9 & 11: Emergency SOS trigger retrieves contacts and calls notification abstraction cleanly',
      JSON.stringify(jsonSOS)
    );

    // ----------------------------------------------------
    // TEST 10: SOS behavior when user has no emergency contacts
    // ----------------------------------------------------
    const emptyUserId = 'no_contacts_user_000';
    const resSOSNoContacts = await fetch(`${baseUrl}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: emptyUserId, latitude: 25.61, longitude: 85.14 })
    });
    const jsonSOSNoContacts = await resSOSNoContacts.json();

    assert(
      resSOSNoContacts.status === 200 &&
      jsonSOSNoContacts.data.contactsNotifiedCount === 0 &&
      jsonSOSNoContacts.data.notification.status === 'NO_CONTACTS_REGISTERED',
      'Test 10: Emergency SOS returns NO_CONTACTS_REGISTERED notification status when zero contacts registered',
      JSON.stringify(jsonSOSNoContacts)
    );

    // ----------------------------------------------------
    // TEST 13, 15 & 16: Update & Delete Contact operations
    // ----------------------------------------------------
    const resUpdate = await fetch(`${baseUrl}/contacts/${createdContactId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919998887776' })
    });
    const jsonUpdate = await resUpdate.json();
    assert(
      resUpdate.status === 200 && jsonUpdate.data.phone === '+919998887776',
      'Test 15: PUT /contacts/:contactId updates contact details successfully',
      JSON.stringify(jsonUpdate)
    );

    const resDelete = await fetch(`${baseUrl}/contacts/${createdContactId}`, {
      method: 'DELETE'
    });
    assert(resDelete.status === 200, 'Test 16: DELETE /contacts/:contactId removes contact successfully');

    // Clean up temporary test data
    await EmergencyContact.deleteMany({ userId: testUserId });
    console.log('\nTemporary emergency test data cleaned up from database.');

  } catch (err) {
    console.error('Unhandled emergency test error:', err);
    failed++;
  } finally {
    if (server) await new Promise(r => server.close(r));
    await mongoose.connection.close();
    console.log(`\n==================================================`);
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);
  }
};

runEmergencyTests();
