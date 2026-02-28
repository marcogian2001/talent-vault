import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/db/schema';


const sqlite = new Database(process.env.DATABASE_URL || 'sqlite.db');
const db = drizzle(sqlite, { schema });

function parseOpportunityBlock(block: string) {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l !== '');
  if (lines.length < 2) return null;

  // The very first line is the name (e.g. "Villa 1", "Private Residency 12")
  const rawName = lines[0];
  const imagePath = `/photos/${rawName.toLowerCase().replace(/\s+/g, '-')}.png`;
  
  // Categorize based on rawName matching
  const data: Record<string, string> = {
    labelTitle: rawName,
    imagePath,
    category: 'Private Residency',
    location: 'Global',
    engagementType: 'Permanent Position',
    compensationText: 'Negotiable',
  };

  for (let i = 1; i < lines.length; i++) {
    const keyStr = lines[i].toLowerCase();
    const valStr = lines[i + 1] || '';

    if (keyStr.includes('posizione') || keyStr === 'categoria') { data.category = valStr; i++; }
    if (keyStr.includes('struttura') || keyStr === 'nome' || keyStr === 'imbarcazione') { data.propertyName = valStr; i++; }
    if (keyStr.includes('località') || keyStr.includes('location')) { data.location = valStr; i++; }
    if (keyStr.includes('nazione')) { data.country = valStr; i++; }
    if (keyStr.includes('tipologia di servizio') || keyStr.includes('tipologia di contratto')) { data.engagementType = valStr; i++; }
    if (keyStr.includes('ospiti') || keyStr.includes('numero massimo ospiti')) { data.guestCapacity = valStr; i++; }
    if (keyStr.includes('alloggio') || keyStr.includes('accommodation')) { data.accommodationDetails = valStr; i++; }
    if (keyStr.includes('compenso') || keyStr.includes('compenso – single service')) { 
      data.compensationText = valStr; 
      // Extract numeric value for slider
      const match = valStr.replace(/\./g, '').match(/\d+/);
      if (match) data.compensationNumeric = match[0];
      i++; 
    }
    if (keyStr.includes('benefit inclusi')) { data.benefits = valStr; i++; }
    if (keyStr.includes('bandiera')) { data.flag = valStr; i++; }
    if (keyStr.includes('equipaggio')) { data.crewSize = valStr; i++; }
    if (keyStr.includes('controproposta')) { data.allowCounterProposal = 'true'; }
  }

  // Sanitize numeric fields
  const numericComp = parseInt(data.compensationNumeric || '0', 10);
  const guestCap = parseInt(data.guestCapacity || '0', 10);
  const crewSz = parseInt(data.crewSize || '0', 10);

  // Final Category Mapping
  let finalCat = 'Private Residency';
  const cMatches = (data.category + ' ' + rawName).toLowerCase();
  if (cMatches.includes('villa') || cMatches.includes('residenc') || cMatches.includes('chef')) finalCat = 'Private Residency';
  if (cMatches.includes('yacht')) finalCat = 'Private Yacht';
  if (cMatches.includes('expedition')) finalCat = 'Expedition Cruises';
  if (cMatches.includes('resort')) finalCat = 'Luxury Resort';
  if (cMatches.includes('ristorante') || cMatches.includes('restaurant') || cMatches.includes('omakase')) finalCat = 'Fine Dining Omakase';

  // Final Engagement Mapping
  let finalEng = 'Permanent Position';
  const eMatches = (data.engagementType || '').toLowerCase();
  if (eMatches.includes('single')) finalEng = 'Single Service';
  else if (eMatches.includes('stagion') || eMatches.includes('mesi') || eMatches.includes('season')) finalEng = 'Seasonal';
  else if (eMatches.includes('omakase service') || eMatches.includes('tour') || eMatches.includes('appointment')) finalEng = 'Appointment';
  else finalEng = 'Permanent Position';

  return {
    id: crypto.randomUUID(),
    category: finalCat,
    labelTitle: data.labelTitle,
    imagePath: data.imagePath,
    location: data.location,
    country: data.country || null,
    engagementType: finalEng,
    compensationText: data.compensationText,
    compensationNumeric: isNaN(numericComp) ? null : numericComp,
    allowCounterProposal: data.allowCounterProposal === 'true',
    propertyName: data.propertyName || null,
    vesselName: data.propertyName || null,
    guestCapacity: isNaN(guestCap) ? null : guestCap,
    accommodationDetails: data.accommodationDetails || null,
    benefits: data.benefits || null,
    flag: data.flag || null,
    crewSize: isNaN(crewSz) ? null : crewSz,
  };
}

async function run() {
  const filePath = path.join(process.cwd(), 'rules', 'opportunites.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Split by line combinations indicating block separators "---" or "----"
  const blocks = content.split(/\n-+\s*\n/);
  
  const insertData = [];

  for (const block of blocks) {
    if (block.trim().length === 0) continue;
    const parsed = parseOpportunityBlock(block);
    if (parsed) {
      insertData.push(parsed);
    }
  }

  console.log(`Found ${insertData.length} opportunities to insert.`);

  // Insert into DB
  try {
    await db.delete(schema.opportunities); // clear existing
    for (const record of insertData) {
      await db.insert(schema.opportunities).values(record);
    }
    console.log('Seeded successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

run();
