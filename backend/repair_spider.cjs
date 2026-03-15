const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// The DB Path where our React frontend reads the dynamic data
const DB_PATH = path.join(__dirname, '../public/dynamic_intel_db.json');

// Mock list of known logic board components to search for in forum texts
const KNOWN_COMPONENTS = ['CD3217', 'U2', 'Tristar', 'M1 NAND', 'PMIC', 'PP_VDD_MAIN', 'L7001', 'U1400', 'M92T36'];

console.log("🕷️ BoardX PRO 'Repair Spider' Agent Initialized...");
console.log("📅 Nightly scraping chron-job scheduled for 03:00 AM.");

/**
 * 🕵️‍♂️ The Research Agent:
 * Crawls a well-known electronics repair URL and extracts text/titles.
 */
async function crawlRepairForums() {
    console.log("=> 🔎 Booting Research Agent. Scraping newest repair posts...");
    try {
        // Mock target: Replace with real scraping targets like BadCaps, iFixit Answers, iOS repair subreddits.
        // For demonstration, we will simulate a data payload as scraping production forums requires bypassing Cloudflare/Bot-protection.
        const mockScrapedTitles = [
            "SOLVED: iPhone 14 Pro dead, 0.00A. Found short on PP_VDD_MAIN, injected 1V and C4201 got blistering hot.",
            "MacBook M2 820-02536 looping. 5V 0.02A on ammeter. CD3217 LDO outputs missing.",
            "Nintendo Switch no charge - Replaced M92T36 but now getting Error 2101-0001.",
            "iPad Pro 11-inch. No backlight. Found broken filter FL4304 near the display FPC."
        ];

        console.log(`=> 📥 Research Agent retrieved ${mockScrapedTitles.length} active threads.`);
        return mockScrapedTitles;
    } catch (e) {
        console.error("Agent failed to scrape:", e.message);
        return [];
    }
}

/**
 * 💡 The Idea Extraction Agent:
 * Parses raw scraped data looking for known components and symptoms to turn into actionable intel.
 */
function extractIntelFromRawData(rawPosts) {
    console.log("=> 🧠 Booting Idea Agent. Analyzing raw forum text...");
    const extractedIntel = [];

    rawPosts.forEach((post, index) => {
        let matchedComponent = null;

        // Hunt for component mentions
        for (const comp of KNOWN_COMPONENTS) {
            if (post.includes(comp)) {
                matchedComponent = comp;
                break;
            }
        }

        // If a component is found, calculate a "Community Confidence Score" based on NLP/Keywords
        if (matchedComponent) {
            let confidence = 50;
            if (post.toLowerCase().includes('solved') || post.toLowerCase().includes('fixed')) confidence += 35;
            if (post.toLowerCase().includes('hot') || post.toLowerCase().includes('short')) confidence += 10;

            extractedIntel.push({
                intel_id: `INTEL-${Date.now()}-${index}`,
                component: matchedComponent,
                symptom_summary: post,
                confidence_score: confidence,
                date_discovered: new Date().toISOString(),
                source: 'Agent Web Crawl'
            });
        }
    });

    console.log(`=> 💡 Idea Agent successfully extracted ${extractedIntel.length} actionable diagnostic rules.`);
    return extractedIntel;
}

/**
 * 💾 The DB Compiler Agent:
 * Saves the extracted ideas into the frontend-accessible JSON database.
 */
function updateMasterDatabase(newIntel) {
    console.log("=> 💾 Booting DB Agent. Pushing new intel to BoardX PRO application...");

    let currentDB = [];
    if (fs.existsSync(DB_PATH)) {
        currentDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }

    // Merge new intel
    const updatedDB = [...newIntel, ...currentDB];

    fs.writeFileSync(DB_PATH, JSON.stringify(updatedDB, null, 2));
    console.log("=> ✅ Success! New logic board data injected into frontend ecosystem.");
}

// -------------------------------------------------------------
// 🕒 Chron-Job Scheduler (Runs every day at 3:00 AM)
// -------------------------------------------------------------
cron.schedule('0 3 * * *', async () => {
    console.log("\n--- ⏰ Nightly Crawl Triggered ---");
    const rawData = await crawlRepairForums();
    if (rawData.length > 0) {
        const processedIntel = extractIntelFromRawData(rawData);
        updateMasterDatabase(processedIntel);
    }
});

// Immediately invoke for development testing
(async () => {
    console.log("\n--- 🔧 Immediate Dev Run Triggered ---");
    const rawData = await crawlRepairForums();
    const processedIntel = extractIntelFromRawData(rawData);
    updateMasterDatabase(processedIntel);
})();
