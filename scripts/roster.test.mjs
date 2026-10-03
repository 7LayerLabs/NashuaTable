import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,reconcile} from './reconcile-roster.mjs';
test('CSV roster supports quoted commas and escaped quotes',()=>{assert.deepEqual(parseCSV('name,address\r\n"Cafe, Inc.","1 Main St"\r\n"The ""Place""",2 Broad St'),[['name','address'],['Cafe, Inc.','1 Main St'],['The "Place"','2 Broad St']]);assert.throws(()=>parseCSV('"broken'));});
test('roster comparison does not confuse a replacement tenant with the original business',()=>{const result=reconcile('name,address,category\nOld Cafe,1 Main St,Restaurant\nNew Cafe,1 Main Street,Restaurant\nSchool Cafe,99 Pine St,School',[{id:'old',name:'Old Cafe',address:'1 Main Street, Nashua, NH'}]);assert.deepEqual(result.map(r=>r.result),['matched_name_and_address','same_address_review_identity','unmatched_candidate']);assert.equal(result[2].category,'School');});
