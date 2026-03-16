import { useState, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './App.css';

interface TestPoint {
  id: string;
  type: string;
  name: string;
  ohmsGround: number | string;
  diodeMode: number | string;
  status: 'critical' | 'normal' | 'power' | 'data';
  description: string;
  x: number;
  y: number;
  isPro?: boolean;
}

interface CustomReading {
  id: string;
  board: string;
  component: string;
  measuredOhms: string;
  measuredDiode: string;
  notes: string;
  date: string;
}

interface QAThread {
  id: string;
  author: string;
  title: string;
  content: string;
  board: string;
  replies: number;
  upvotes: number;
  isSolved: boolean;
}

const mockBoards = [
  { id: 'ip14p', name: 'iPhone 14 Pro (A2890)' },
  { id: 'mbpM2', name: 'MacBook Pro M2 (A2338)' },
  { id: 's23u', name: 'Samsung S23 Ultra' },
  { id: 'rzBlade', name: 'Razer Blade 15/16/18' },
  { id: 'asusROG', name: 'ASUS ROG Strix / Zephyrus' },
  { id: 'lenovoLegion', name: 'Lenovo Legion 5/7/Pro' }
];

const mockBoardData: TestPoint[] = [
  { id: 'C4201', type: 'Capacitor', name: 'PP_VDD_MAIN Decoupling', ohmsGround: '15k', diodeMode: 320, status: 'power', description: 'Main system power line decoupling', x: 30, y: 20 },
  { id: 'R3102', type: 'Resistor', name: 'I2C0_SDA Pull-Up', ohmsGround: '2.2k', diodeMode: 450, status: 'data', description: 'Data line for I2C bus 0.', x: 45, y: 60 },
  { id: 'L7001', type: 'Inductor', name: 'Buck Converter LX Node', ohmsGround: '50', diodeMode: 150, status: 'power', description: 'Low resistance to ground is normal.', x: 60, y: 35 },
  { id: 'D5002', type: 'Diode', name: 'USB VBUS Protection', ohmsGround: 'OL', diodeMode: 500, status: 'critical', description: 'TVS diode protecting USB input.', x: 15, y: 85 },
  { id: 'U3200', type: 'IC', name: 'Touch Controller', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'normal', description: 'Check 1.8V and 5V inputs.', x: 75, y: 70, isPro: true },
  { id: 'C912', type: 'Capacitor', name: 'PP_GPU_SRAM', ohmsGround: '12', diodeMode: 50, status: 'power', description: 'Extremely low resistance is normal.', x: 50, y: 50, isPro: true },
  { id: 'U1400', type: 'IC', name: 'Audio Codec (PRO)', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'critical', description: 'Common failure point for bootloop.', x: 80, y: 40, isPro: true },
  { id: 'J4300_PIN4', type: 'FPC Connector', name: 'Screen Connector (Pin 4)', ohmsGround: '400k', diodeMode: 450, status: 'data', description: 'MIPI Data Line. Check component FL4304 if this pin reads OL.', x: 25, y: 15, isPro: true },
  { id: 'J4300_PIN6', type: 'FPC Connector', name: 'Screen Connector (Pin 6)', ohmsGround: 'OL', diodeMode: 'OL', status: 'power', description: 'NC (Not Connect) Pin. Should always be OL.', x: 25, y: 17, isPro: true },
  // M-Series Data
  { id: 'CD3217_U1', type: 'IC', name: 'USB-C Power Controller', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'power', description: 'If USB-C remains stuck at 5V and won\'t negotiate to 20V, this chip is likely dead. Verify LDO voltage outputs around it.', x: 10, y: 40, isPro: true },
  { id: 'NAND_VCCQ', type: 'Power Rail', name: 'NAND Flash 2.5V', ohmsGround: '150', diodeMode: 300, status: 'critical', description: 'If board refuses to enter DFU mode or power on, check for dead short here. A 13V surge from a bad mosfet instantly kills M-series NAND chips causing complete data loss.', x: 45, y: 70, isPro: true },
  // MacBook Laptop Power Rails
  { id: 'PPBUS_G3H', type: 'Power Rail', name: 'PPBUS_G3H (Main Bus)', ohmsGround: '2k', diodeMode: 520, status: 'power', description: 'The master power bus. Should read 12.56V (Pro 3S) or 8.4V (Air 2S). If missing or low, check ISL6259/U7100 charging IC and input fuse.', x: 20, y: 30, isPro: true },
  { id: 'PP3V42_G3H', type: 'Power Rail', name: 'PP3V42_G3H (SMC Standby)', ohmsGround: '10k', diodeMode: 410, status: 'power', description: 'First rail to come alive. Powers the SMC. If missing: SMC is dead or U7090 regulator is blown. No MagSafe light without this rail.', x: 35, y: 25, isPro: true },
  { id: 'PP3V3_S5', type: 'Power Rail', name: 'PP3V3_S5 (Deep Sleep 3.3V)', ohmsGround: '5k', diodeMode: 380, status: 'power', description: 'Created from PPBUS after SMC asserts PM_G2_EN. Powers PCH RTC and suspend wells. If cycling: short on downstream S0 rail.', x: 50, y: 45, isPro: true },
  { id: 'PP5V_S5', type: 'Power Rail', name: 'PP5V_S5 (Deep Sleep 5V)', ohmsGround: '3k', diodeMode: 440, status: 'power', description: 'Sister rail to PP3V3_S5, also generated during S5 state. If missing while PP3V3_S5 is present, check the buck converter responsible.', x: 55, y: 48, isPro: true },
  { id: 'ALL_SYS_PWRGD', type: 'Signal', name: 'ALL_SYS_PWRGD', ohmsGround: 'OL', diodeMode: 'OL', status: 'data', description: 'Critical 3.3V signal. If LOW, one or more S0 power rails has failed to assert Power Good. Trace upstream until you find the missing rail.', x: 65, y: 55, isPro: true },
  { id: 'SMC_PM_G2_EN', type: 'Signal', name: 'SMC_PM_G2_EN (Boot Trigger)', ohmsGround: 'OL', diodeMode: 'OL', status: 'data', description: 'SMC asserts this HIGH after power button press. This enables PP3V3_S5. If stuck LOW, the SMC is not receiving the power button signal or is itself faulty.', x: 40, y: 38, isPro: true },
  { id: 'ISL6259', type: 'IC', name: 'ISL6259 Charge Controller', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'power', description: 'Intel MacBook charging IC. Creates PPBUS_G3H from charger/battery input. If PPBUS is low/fluctuating, check this IC and surrounding MOSFETs Q7130/Q7135.', x: 15, y: 55, isPro: true },
  { id: 'U7090_LDO', type: 'IC', name: 'U7090 (3V42 LDO Regulator)', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'power', description: 'Creates PP3V42_G3H from PPBUS. If no MagSafe light at all, this LDO or its enable line may be the fault.', x: 30, y: 60, isPro: true },
  // ==================== RAZER BLADE ====================
  { id: 'RZ_19V_INPUT', type: 'Power Rail', name: '19V DC Input Rail', ohmsGround: '500', diodeMode: 480, status: 'power', description: 'Main power input from the 230W barrel jack charger. If laptop won\'t charge, check this rail first. Common failure: 19V rail shorts to ground near fan screw mount (Blade 14 design flaw).', x: 10, y: 15, isPro: true },
  { id: 'RZ_VCORE_CPU', type: 'Power Rail', name: 'CPU VCore (VRM Output)', ohmsGround: '8', diodeMode: 120, status: 'critical', description: 'CPU core voltage rail — extremely low resistance to ground is normal. If dead short (0Ω), one of the VRM MOSFETs has failed. Check with thermal camera under load.', x: 35, y: 30, isPro: true },
  { id: 'RZ_VCORE_GPU', type: 'Power Rail', name: 'GPU VCore (VRM Output)', ohmsGround: '5', diodeMode: 90, status: 'critical', description: 'GPU core voltage from discrete VRM. Nvidia RTX mobile GPUs draw extreme current. If VRM MOSFETs are cracked or shorted, GPU won\'t initialize. Artifacting = often a dying GPU VRM, not the GPU itself.', x: 55, y: 35, isPro: true },
  { id: 'RZ_VAPOR_CHAMBER', type: 'Thermal', name: 'Vapor Chamber Assembly', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'critical', description: 'Razer Blade 16/18 (2023-2024) has a known vapor chamber failure. Symptoms: fans max speed, lukewarm exhaust, CPU throttling to 800MHz. Razer charges $2,400 for motherboard replacement. Can often be fixed with repaste + thermal pad replacement.', x: 45, y: 50, isPro: true },
  { id: 'RZ_BATT_SWELL', type: 'Battery', name: 'Battery Swelling Diagnostic', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'critical', description: 'Razer\'s #1 issue. Check: lifted trackpad/keyboard, laptop rocking on flat surface, split seams. Battery degrades in 3-5 years especially with heat. 2022+ models have charge limiter. T5 screws to remove.', x: 70, y: 80, isPro: true },
  { id: 'RZ_FAN_SCREW_SHORT', type: 'PCB Fault', name: '19V Rail Proximity Short', ohmsGround: 'SHORT', diodeMode: 0, status: 'critical', description: 'DESIGN FLAW (Blade 14 2022/2023): The 19V power rail trace runs dangerously close to the fan screw mount. Over time, vibration or over-torquing causes a short circuit, burning the PCB. Requires trace rebuild and careful insulation.', x: 20, y: 45, isPro: true },
  { id: 'RZ_EC_CHIP', type: 'IC', name: 'EC (Embedded Controller)', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'data', description: 'Razer\'s EC handles keyboard, Synapse RGB, fan curves, and power management. If EC firmware is corrupted, keyboard/trackpad may stop responding entirely. Often confused with motherboard failure.', x: 60, y: 20, isPro: true },
  // ==================== ASUS ROG ====================
  { id: 'ASUS_19V_IN', type: 'Power Rail', name: '19V/20V DC-In Rail', ohmsGround: '600', diodeMode: 500, status: 'power', description: 'Main power input from barrel jack or USB-C PD charger. ROG Strix G16 (2023/2024) has a known motherboard burnout issue near the fan screw area causing electrical discharge.', x: 12, y: 20, isPro: true },
  { id: 'ASUS_CPU_VRM', type: 'VRM', name: 'CPU VRM Phase Array', ohmsGround: '3', diodeMode: 80, status: 'critical', description: 'Multi-phase VRM for high-TDP Intel/AMD CPUs. Bad capacitors or cracked MOSFETs cause random shutdowns under load. Visual inspection: look for burn marks, bulging capacitors, or burnt smell near CPU socket area.', x: 30, y: 40, isPro: true },
  { id: 'ASUS_GPU_VRM', type: 'VRM', name: 'GPU VRM Phase Array', ohmsGround: '4', diodeMode: 95, status: 'critical', description: 'Discrete GPU VRM. PCIe link can desync during power state transitions causing WHEA 0x124 crashes, black screens, and system hangs. This is NOT always a GPU failure — check VRM first.', x: 50, y: 45, isPro: true },
  { id: 'ASUS_EC_RESET', type: 'Signal', name: 'EC Reset (Ctrl+Shift+R)', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'data', description: 'ASUS ROG EC reset: Hold Ctrl+Shift+R while pressing power for 10-15s. This resets the Embedded Controller without opening the device. Fixes many "won\'t power on" issues caused by EC hang.', x: 40, y: 60, isPro: true },
  { id: 'ASUS_USB_PD', type: 'IC', name: 'USB-C PD Controller', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'power', description: 'USB-C Power Delivery negotiation IC. If laptop shows "slow charging" warnings with correct 100W+ charger, this IC may be faulty. Check if barrel jack charging works normally to isolate.', x: 18, y: 70, isPro: true },
  { id: 'ASUS_DISPLAY_MUX', type: 'IC', name: 'MUX Switch (GPU Routing)', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'data', description: 'Advanced Optimus / MUX switch routes display output directly from dGPU (bypassing iGPU). If MUX switch fails: external monitor works but internal screen is black, or vice versa. Not a GPU failure.', x: 65, y: 30, isPro: true },
  // ==================== LENOVO LEGION ====================
  { id: 'LEN_20V_INPUT', type: 'Power Rail', name: '20V DC-In (Slim Tip)', ohmsGround: '550', diodeMode: 490, status: 'power', description: 'Lenovo Legion uses 170W-300W slim-tip chargers at 20V. If no power: check charger output with multimeter (should read 19.5-20V). USB-C PD charging is also supported on some models.', x: 10, y: 25, isPro: true },
  { id: 'LEN_CPU_BGA', type: 'BGA', name: 'CPU BGA Solder Joints', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'critical', description: 'EPIDEMIC: AMD Ryzen 5000 series Legion boards (NM-D562/NM-D563) have widespread solder joint failure. Symptoms: completely dead or no display. Lenovo uses black epoxy underfill making repair very difficult. Often requires CPU reballing.', x: 40, y: 35, isPro: true },
  { id: 'LEN_GPU_BGA', type: 'BGA', name: 'GPU BGA Solder Joints', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'critical', description: 'RTX 3060/3070 mobile GPUs on Legion boards suffer same solder joint epidemic as CPU. GPU not detected in Device Manager (Error 43) after thermal cycling. Reball or reflow may restore.', x: 55, y: 40, isPro: true },
  { id: 'LEN_EC_NOVO', type: 'Signal', name: 'Novo Button / EC Recovery', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'data', description: 'Lenovo\'s hardware recovery button (pinhole on side). Press with paperclip to access BIOS, recovery, or boot menu without needing keyboard/screen. Essential for diagnosing "no display" vs "no boot".', x: 75, y: 60, isPro: true },
  { id: 'LEN_HYBRID_MODE', type: 'Software', name: 'Hybrid Mode Switch', ohmsGround: 'n/a', diodeMode: 'n/a', status: 'data', description: 'Lenovo Vantage Hybrid Mode routes display through iGPU for battery savings. If dGPU is "not detected", disable Hybrid Mode in Vantage first. This is the #1 false alarm for "dead GPU" on Legion laptops.', x: 60, y: 70, isPro: true },
  { id: 'LEN_VRM_MOSFETS', type: 'VRM', name: 'VRM MOSFETs (CPU/GPU)', ohmsGround: '6', diodeMode: 100, status: 'power', description: 'Legion VRM MOSFETs handle extreme current. If laptop makes a "pop" sound and goes black with only the battery LED lit, a MOSFET has likely failed catastrophically. Check for burn marks near the CPU/GPU heatsink mount points.', x: 35, y: 55, isPro: true },
];

const mockCommunityQA: QAThread[] = [
  { id: '1', author: 'TechFix_Dave', title: 'iPhone 14 Pro not charging after drop, Tristar?', content: 'Getting 0.00A on ammeter, diode mode on D5002 is showing OL which is normal, what next?', board: 'ip14p', replies: 4, upvotes: 12, isSolved: true },
  { id: '2', author: 'SolderKing', title: 'MacBook M2 5V 0A bootloop fix', content: 'If you are stuck at 5V check U1400 specifically, I found a 0.05v short on the I2C line causing PP_BUS to halt.', board: 'mbpM2', replies: 1, upvotes: 8, isSolved: false },
  { id: '3', author: 'NewbieTech', title: 'What is a normal reading for L7001?', content: 'BoardX says 150mV, I am getting 142mV. Is that a short?', board: 'ip14p', replies: 8, upvotes: 2, isSolved: false },
  { id: '4', author: 'RazerRepairGuy', title: 'Blade 14 dead after fan cleaning — 19V short!', content: 'Over-torqued the fan screw and it shorted the 19V rail trace. Burnt a hole in the PCB. Had to rebuild the trace with wire and epoxy. CAREFUL with that screw!', board: 'rzBlade', replies: 15, upvotes: 34, isSolved: true },
  { id: '5', author: 'VaporFixPro', title: 'Blade 16 vapor chamber fix WITHOUT motherboard swap', content: 'Razer wanted $2,400. I repasted with PTM7950 and replaced all thermal pads with Thermalright Odyssey. Temps dropped 25°C. Saved the board.', board: 'rzBlade', replies: 22, upvotes: 67, isSolved: true },
  { id: '6', author: 'ROG_TechLab', title: 'Strix G16 random shutdowns under load — NOT the GPU', content: 'Spent weeks thinking it was GPU. Turns out it was a cracked VRM MOSFET. Only visible under 40x microscope. Replaced Q3201 and stable since.', board: 'asusROG', replies: 9, upvotes: 28, isSolved: true },
  { id: '7', author: 'LegionFixit', title: 'Legion 5 Pro completely dead — BGA reball saved it', content: 'AMD Ryzen 5800H on NM-D562 board. Classic solder joint failure. Reballed the CPU and it came back to life. Lenovo quoted $800 for new mobo.', board: 'lenovoLegion', replies: 11, upvotes: 41, isSolved: true },
  { id: '8', author: 'GPUhunter', title: 'Legion 7 dGPU missing — it was Hybrid Mode lol', content: 'Panicked for an hour thinking my 3070 was dead. Turns out Lenovo Vantage had Hybrid Mode on, routing everything through iGPU. Disable it in Vantage settings.', board: 'lenovoLegion', replies: 5, upvotes: 19, isSolved: true }
];

function App() {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'database' | 'community' | 'tools' | 'pricing'>('diagnostics');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<TestPoint | null>(null);
  const [selectedBoard, setSelectedBoard] = useState(mockBoards[0].id);
  type UserTier = 'free' | 'pro' | 'elite';
  const [userTier, setUserTier] = useState<UserTier>(() => {
    return (localStorage.getItem('boardx_user_tier') as UserTier) || 'free';
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<'pro' | 'elite'>('pro');

  const hasAccess = (requiredTier: 'pro' | 'elite') => {
    if (requiredTier === 'pro') return userTier === 'pro' || userTier === 'elite';
    if (requiredTier === 'elite') return userTier === 'elite';
    return false;
  };
  const isProUser = hasAccess('pro');
  const isEliteUser = hasAccess('elite');

  const openCheckout = (tier: 'pro' | 'elite') => {
    setCheckoutTier(tier);
    setIsCheckoutOpen(true);
  };

  // Custom Database State
  const [newReading, setNewReading] = useState({ component: '', ohms: '', diode: '', notes: '' });

  // Smart Tools State
  const [calcKnown, setCalcKnown] = useState('');
  const [calcReading, setCalcReading] = useState('');
  const [calcResult, setCalcResult] = useState<{ dev: string, alert: boolean, msg: string } | null>(null);

  const [injOhms, setInjOhms] = useState('');
  const [injResult, setInjResult] = useState<{ volts: string, amps: string, temp: string } | null>(null);

  // Repair Cost Estimator State
  const [costFault, setCostFault] = useState('');
  const [costResult, setCostResult] = useState<{ parts: string, labor: string, total: string, difficulty: string, time: string, margin: string } | null>(null);

  // Component Cross-Reference State
  const [xrefSearch, setXrefSearch] = useState('');

  // Repair Job Tracker State
  interface RepairJob {
    id: string;
    device: string;
    customer: string;
    fault: string;
    status: 'intake' | 'diagnosing' | 'parts-ordered' | 'repairing' | 'testing' | 'complete';
    date: string;
    notes: string;
  }
  const [repairJobs, setRepairJobs] = useState<RepairJob[]>(() => {
    const saved = localStorage.getItem('boardx_repair_jobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [newJob, setNewJob] = useState({ device: '', customer: '', fault: '', notes: '' });

  const COST_DATABASE: Record<string, { parts: number, labor: number, difficulty: string, time: string }> = {
    'tristar': { parts: 3, labor: 80, difficulty: 'Advanced', time: '45 min' },
    'audio-ic': { parts: 5, labor: 120, difficulty: 'Expert', time: '1.5 hrs' },
    'backlight-filter': { parts: 1, labor: 60, difficulty: 'Intermediate', time: '30 min' },
    'nand-reball': { parts: 0, labor: 200, difficulty: 'Expert', time: '2-3 hrs' },
    'baseband-ic': { parts: 15, labor: 180, difficulty: 'Expert', time: '2 hrs' },
    'charge-port': { parts: 8, labor: 40, difficulty: 'Beginner', time: '20 min' },
    'battery-replace': { parts: 25, labor: 20, difficulty: 'Beginner', time: '15 min' },
    'screen-replace': { parts: 80, labor: 30, difficulty: 'Beginner', time: '20 min' },
    'pmic-replace': { parts: 10, labor: 150, difficulty: 'Expert', time: '1.5 hrs' },
    'vrm-mosfet': { parts: 2, labor: 90, difficulty: 'Advanced', time: '1 hr' },
    'bga-reball': { parts: 5, labor: 250, difficulty: 'Expert', time: '3-4 hrs' },
    'vapor-chamber-repaste': { parts: 15, labor: 60, difficulty: 'Intermediate', time: '45 min' },
    'trace-rebuild': { parts: 1, labor: 120, difficulty: 'Expert', time: '1-2 hrs' },
    'ec-reflash': { parts: 0, labor: 80, difficulty: 'Advanced', time: '45 min' },
    'capacitor-replace': { parts: 0.50, labor: 40, difficulty: 'Intermediate', time: '15 min' },
    'usb-c-controller': { parts: 8, labor: 100, difficulty: 'Advanced', time: '1 hr' },
    'liquid-damage-clean': { parts: 5, labor: 80, difficulty: 'Intermediate', time: '1 hr' },
    'mux-switch': { parts: 12, labor: 130, difficulty: 'Expert', time: '1.5 hrs' },
  };

  const XREF_DATABASE: Record<string, { chip: string, boards: string[], alternatives: string[], notes: string }> = {
    'CD3217': { chip: 'CD3217B12 (USB-C PD Controller)', boards: ['MacBook Pro 2016-2020', 'MacBook Air 2018-2020'], alternatives: ['CD3215C00'], notes: 'TI chip. Controls USB-C power negotiation. If stuck at 5V 0A, this is the culprit.' },
    'ISL6259': { chip: 'ISL6259HRTZ (Charger IC)', boards: ['MacBook Pro 2012-2015', 'MacBook Air 2013-2017'], alternatives: ['ISL6258'], notes: 'Intersil/Renesas. Creates PPBUS_G3H from charger input. Check Q7130/Q7135 MOSFETs if PPBUS is low.' },
    'U2': { chip: 'CBTL1610A (Tristar)', boards: ['iPhone 6-8', 'iPhone SE 1st/2nd Gen'], alternatives: ['CBTL1612A1 (Hydra)'], notes: 'NXP chip. Handles USB data/charging negotiation. Fake charging = Tristar.' },
    'U1400': { chip: '338S1285 (Audio Codec)', boards: ['iPhone 7', 'iPhone 7 Plus'], alternatives: ['None'], notes: 'Apple custom. Loop Disease — causes bootloop. Requires BGA rework with fresh solder balls.' },
    'RTX3060M': { chip: 'GA106 (RTX 3060 Mobile)', boards: ['Razer Blade 15 2021', 'ASUS ROG Strix G15', 'Lenovo Legion 5'], alternatives: ['GA106-300 (Desktop)'], notes: 'Nvidia Ampere mobile. BGA solder joint failure common on Lenovo NM-D562 boards.' },
    'RTX3070M': { chip: 'GA104 (RTX 3070 Mobile)', boards: ['Razer Blade 15 2021', 'ASUS ROG Zephyrus G15', 'Lenovo Legion 7'], alternatives: ['GA104-300 (Desktop)'], notes: 'Nvidia Ampere mobile. Higher TDP variant more prone to thermal cycling failures.' },
    'R5800H': { chip: 'AMD Ryzen 7 5800H (Cezanne)', boards: ['Lenovo Legion 5 Pro', 'ASUS ROG Strix G15 2021'], alternatives: ['R5900HX'], notes: 'AMD Zen3 mobile. Lenovo NM-D562/D563 boards have epidemic BGA solder joint failure with this CPU.' },
    'IT8987E': { chip: 'IT8987E (Embedded Controller)', boards: ['Razer Blade 14/15/16', 'Various ASUS ROG'], alternatives: ['IT8986E'], notes: 'ITE Tech EC. Controls keyboard, fans, power sequencing. EC hang mimics dead motherboard.' },
  };

  const runCostEstimate = () => {
    if (!costFault || !COST_DATABASE[costFault]) return;
    const data = COST_DATABASE[costFault];
    const total = data.parts + data.labor;
    const margin = total * 2.5; // Suggested retail at 2.5x
    setCostResult({
      parts: `$${data.parts.toFixed(2)}`,
      labor: `$${data.labor.toFixed(2)}`,
      total: `$${total.toFixed(2)}`,
      difficulty: data.difficulty,
      time: data.time,
      margin: `$${margin.toFixed(2)}`
    });
  };

  const saveRepairJob = () => {
    if (!newJob.device || !newJob.fault) return;
    const job: RepairJob = {
      id: Date.now().toString(),
      device: newJob.device,
      customer: newJob.customer || 'Walk-in',
      fault: newJob.fault,
      status: 'intake',
      date: new Date().toLocaleDateString(),
      notes: newJob.notes
    };
    const updated = [job, ...repairJobs];
    setRepairJobs(updated);
    localStorage.setItem('boardx_repair_jobs', JSON.stringify(updated));
    setNewJob({ device: '', customer: '', fault: '', notes: '' });
  };

  const updateJobStatus = (id: string, status: RepairJob['status']) => {
    const updated = repairJobs.map(j => j.id === id ? { ...j, status } : j);
    setRepairJobs(updated);
    localStorage.setItem('boardx_repair_jobs', JSON.stringify(updated));
  };

  // Design Flaws Database
  const [flawFilter, setFlawFilter] = useState('all');
  const DESIGN_FLAWS = [
    { id: 'rz-fan-screw', brand: 'Razer', model: 'Blade 14 (2022-2023)', severity: 'critical', title: '19V Rail Proximity to Fan Screw Mount', description: 'The 19V power rail trace runs within 0.5mm of the fan screw mounting point. Over-torquing or vibration causes the screw to short the trace, burning the PCB. Requires microscope trace rebuild.', fix: 'Apply Kapton tape insulation around fan screw area after repair. Torque to spec only.', discovered: '2023' },
    { id: 'rz-vapor', brand: 'Razer', model: 'Blade 16/18 (2023-2024)', severity: 'high', title: 'Vapor Chamber Manufacturing Defect', description: 'Vapor chambers lose vacuum seal prematurely, causing complete thermal conductivity failure. Fans spin at 100% but exhaust air is lukewarm. CPU throttles to 800MHz.', fix: 'Repaste with PTM7950 + replace all thermal pads. If vapor chamber is truly dead, aftermarket heatsink mod.', discovered: '2024' },
    { id: 'rz-battery', brand: 'Razer', model: 'Blade 15 (2018-2021)', severity: 'critical', title: 'Premature Battery Swelling', description: 'Lithium-ion batteries swell within 2-3 years due to poor thermal management. The chassis retains heat during charging + gaming, accelerating electrolyte decomposition.', fix: 'Replace battery. Enable charge limiter (2022+ firmware). Avoid gaming while charging if possible.', discovered: '2020' },
    { id: 'asus-strix-burn', brand: 'ASUS', model: 'ROG Strix G16 (2023-2024)', severity: 'critical', title: 'Motherboard Burnout Near Fan Screw Area', description: 'Electrical discharge from fan screw mounting area causes PCB burnout. Similar to Razer Blade 14 issue. Affects specific motherboard revisions.', fix: 'Insulate fan screw area. Check for burn marks during any teardown. May require motherboard replacement.', discovered: '2024' },
    { id: 'asus-pcie-desync', brand: 'ASUS', model: 'ROG Zephyrus G14/G15 (2021-2022)', severity: 'medium', title: 'PCIe Link Desync During Power Transitions', description: 'GPU and CPU disagree on sleep exit timing, causing PCIe link to desynchronize. Results in WHEA 0x124 crashes, random black screens, and system hangs. Often misdiagnosed as GPU failure.', fix: 'BIOS update often resolves. Disable PCIe power management in Windows. If persistent, VRM capacitor check.', discovered: '2022' },
    { id: 'asus-usb-pd', brand: 'ASUS', model: 'ROG Zephyrus G14 (2022+)', severity: 'low', title: 'USB-C PD Slow Charging False Warning', description: 'Laptop reports "slow charging" with compatible 100W USB-C PD chargers. PD controller IC sometimes fails to negotiate full wattage on first plug.', fix: 'Unplug and replug charger. If persistent, use barrel jack. USB-C PD IC replacement as last resort.', discovered: '2023' },
    { id: 'len-bga-epidemic', brand: 'Lenovo', model: 'Legion 5/5 Pro (Ryzen 5000)', severity: 'critical', title: 'AMD CPU/GPU BGA Solder Joint Epidemic', description: 'NM-D562 and NM-D563 motherboards with Ryzen 5800H + RTX 3060/3070 have widespread BGA solder joint failure. Black epoxy underfill makes repair extremely difficult.', fix: 'CPU and/or GPU reballing. Lenovo uses lead-free solder that cracks under thermal cycling. Consider leaded solder for reball.', discovered: '2023' },
    { id: 'len-hinge', brand: 'Lenovo', model: 'Legion 5 (2020-2021)', severity: 'medium', title: 'Display Hinge Stress Fracture on Motherboard', description: 'The display hinge mounting puts excessive mechanical stress on the motherboard near the power connector area. Over time, the PCB develops hairline fractures causing intermittent power issues.', fix: 'Reinforce hinge mounting point. Check for hairline cracks with magnification near DC-in jack area.', discovered: '2022' },
    { id: 'ip7-audio', brand: 'Apple', model: 'iPhone 7 / 7 Plus', severity: 'critical', title: 'Audio IC (U1400) "Loop Disease"', description: 'The audio codec IC (338S1285) develops cracked solder balls due to board flex from repeated drops/bends. Causes bootloop, no audio, or greyed-out speaker icon.', fix: 'Reball U1400 with fresh solder balls. Add underfill for longevity. Some techs add a thin foam pad underneath for flex resistance.', discovered: '2018' },
    { id: 'ip6-tristar', brand: 'Apple', model: 'iPhone 6-8 Series', severity: 'high', title: 'Tristar IC Charging Failure', description: 'CBTL1610A (Tristar) / CBTL1612A1 (Hydra) IC fails from using non-MFi Lightning cables. Symptoms: fake charging (shows charging but percentage drops), no USB data, no restore.', fix: 'Replace Tristar/Hydra IC. Always use MFi-certified cables. Check D5002 diode mode for confirmation.', discovered: '2016' },
    { id: 'mbp-flexgate', brand: 'Apple', model: 'MacBook Pro 13" (2016-2017)', severity: 'high', title: 'Flexgate (Display Backlight Cable Failure)', description: 'The display backlight flex cable is too short and wears from repeated opening/closing of the lid. Causes "stage light" effect at bottom of screen, then complete backlight failure.', fix: 'Replace display flex cable (aftermarket extended cables available). Apple offered free repair program for affected models.', discovered: '2019' },
    { id: 'mbp-t2-bridge', brand: 'Apple', model: 'MacBook Pro/Air (2018-2020 T2)', severity: 'medium', title: 'T2 Bridge OS Corruption', description: 'The T2 security chip can enter a state where Bridge OS is corrupted but not fully bricked. Symptoms: black screen, fans spin, keyboard backlight on, but no boot. Often mistaken for logic board failure.', fix: 'DFU restore using Apple Configurator 2 on another Mac + USB-C cable. Hold power + right Shift + left Option + left Control for 10 seconds.', discovered: '2020' },
  ];

  // Power Tree Data
  const POWER_TREES: Record<string, { name: string, nodes: { id: string, label: string, voltage: string, parent: string | null, color: string }[] }> = {
    'macbook': {
      name: 'MacBook Pro Intel Power Tree',
      nodes: [
        { id: 'charger', label: 'MagSafe / USB-C', voltage: '20V', parent: null, color: '#58a6ff' },
        { id: 'ppbus', label: 'PPBUS_G3H', voltage: '12.56V', parent: 'charger', color: '#f0883e' },
        { id: 'pp3v42', label: 'PP3V42_G3H', voltage: '3.42V', parent: 'ppbus', color: '#56d364' },
        { id: 'pp5v_s5', label: 'PP5V_S5', voltage: '5.0V', parent: 'ppbus', color: '#56d364' },
        { id: 'pp3v3_s5', label: 'PP3V3_S5', voltage: '3.3V', parent: 'ppbus', color: '#56d364' },
        { id: 'pp5v_s3', label: 'PP5V_S3', voltage: '5.0V', parent: 'pp5v_s5', color: '#d29922' },
        { id: 'pp3v3_s3', label: 'PP3V3_S3', voltage: '3.3V', parent: 'pp3v3_s5', color: '#d29922' },
        { id: 'ppvcore', label: 'CPU VCore', voltage: '0.7-1.2V', parent: 'ppbus', color: '#f85149' },
        { id: 'ppgpu', label: 'GPU VCore', voltage: '0.6-1.0V', parent: 'ppbus', color: '#f85149' },
      ]
    },
    'gaming': {
      name: 'Gaming Laptop Generic Power Tree',
      nodes: [
        { id: 'dcin', label: 'DC-In (Barrel/USB-C)', voltage: '19-20V', parent: null, color: '#58a6ff' },
        { id: 'main_rail', label: 'Main Power Rail', voltage: '19V', parent: 'dcin', color: '#f0883e' },
        { id: 'p5v', label: '5V Rail', voltage: '5.0V', parent: 'main_rail', color: '#56d364' },
        { id: 'p3v3', label: '3.3V Rail', voltage: '3.3V', parent: 'main_rail', color: '#56d364' },
        { id: 'cpu_vrm', label: 'CPU VRM Output', voltage: '0.6-1.4V', parent: 'main_rail', color: '#f85149' },
        { id: 'gpu_vrm', label: 'GPU VRM Output', voltage: '0.6-1.1V', parent: 'main_rail', color: '#f85149' },
        { id: 'vram', label: 'VRAM Power', voltage: '1.35V', parent: 'gpu_vrm', color: '#d29922' },
        { id: 'pch', label: 'PCH / Chipset', voltage: '1.05V', parent: 'p3v3', color: '#d29922' },
        { id: 'ec_power', label: 'EC Controller', voltage: '3.3V', parent: 'p3v3', color: '#8b949e' },
      ]
    }
  };
  const [selectedTree, setSelectedTree] = useState('macbook');

  // Repair Analytics (computed from job tracker)
  const repairAnalytics = useMemo(() => {
    const total = repairJobs.length;
    const completed = repairJobs.filter(j => j.status === 'complete').length;
    const inProgress = repairJobs.filter(j => !['complete', 'intake'].includes(j.status)).length;
    const intake = repairJobs.filter(j => j.status === 'intake').length;
    const deviceCounts: Record<string, number> = {};
    repairJobs.forEach(j => {
      const brand = j.device.split(' ')[0] || 'Other';
      deviceCounts[brand] = (deviceCounts[brand] || 0) + 1;
    });
    const topDevices = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total, completed, inProgress, intake, topDevices };
  }, [repairJobs]);

  // Ammeter Boot Analyzer State
  const [ammeterReading, setAmmeterReading] = useState('');
  const [ammeterResult, setAmmeterResult] = useState<{ stage: string, status: string, suspects: string[], action: string } | null>(null);

  // Symptom Wizard State
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [wizardResult, setWizardResult] = useState<{ title: string, steps: string[], likelyCulprits: string[] } | null>(null);

  // MacBook Power Sequence Tracer State
  const [sequenceStep, setSequenceStep] = useState(0);

  // Liquid Damage Assessment State
  const [liquidChecks, setLiquidChecks] = useState<Record<string, boolean>>({});

  const LIQUID_DAMAGE_CHECKLIST = [
    { id: 'indicator', label: 'Liquid Contact Indicator (LCI) is triggered (red/pink)', severity: 'high' },
    { id: 'corrosion_visible', label: 'Visible corrosion / green/white deposits on board', severity: 'high' },
    { id: 'sticky_residue', label: 'Sticky residue or sugar crystals on components', severity: 'medium' },
    { id: 'burnt_smell', label: 'Burnt smell from board or charger port area', severity: 'critical' },
    { id: 'connector_corrosion', label: 'FPC connector pins have oxidation or discoloration', severity: 'high' },
    { id: 'battery_swelling', label: 'Battery is swollen or deformed', severity: 'critical' },
    { id: 'keyboard_malfunction', label: 'Keyboard keys are sticky or non-responsive', severity: 'low' },
    { id: 'trackpad_ghost', label: 'Trackpad clicking on its own (ghost touches)', severity: 'medium' },
    { id: 'short_on_rail', label: 'A main power rail shows dead short to ground', severity: 'critical' },
    { id: 'fan_not_spinning', label: 'Fan does not spin despite board powering on', severity: 'medium' },
    { id: 'magsafe_no_light', label: 'MagSafe / USB-C shows no charging indicator', severity: 'high' },
    { id: 'intermittent', label: 'Device works intermittently (sometimes boots, sometimes not)', severity: 'medium' },
  ];

  const getLiquidDamageScore = () => {
    let score = 0;
    LIQUID_DAMAGE_CHECKLIST.forEach(item => {
      if (liquidChecks[item.id]) {
        if (item.severity === 'critical') score += 30;
        else if (item.severity === 'high') score += 20;
        else if (item.severity === 'medium') score += 10;
        else score += 5;
      }
    });
    return Math.min(score, 100);
  };

  const getLiquidDamageVerdict = (score: number) => {
    if (score >= 80) return { text: 'SEVERE DAMAGE — Board-level repair required. Ultrasonic cleaning recommended before any repair attempt.', color: 'var(--accent-red)' };
    if (score >= 50) return { text: 'MODERATE DAMAGE — Targeted cleaning with IPA 99% and component-level inspection needed. Check all rail capacitors.', color: 'var(--accent-orange)' };
    if (score >= 20) return { text: 'LIGHT DAMAGE — Spot clean affected areas with IPA. Board is likely repairable with minimal component replacement.', color: 'var(--accent-cyan)' };
    return { text: 'MINIMAL/NO DAMAGE — Board appears clean. Issue is likely unrelated to liquid.', color: 'var(--accent-green)' };
  };

  const MACBOOK_POWER_SEQUENCE = [
    { rail: 'PPBUS_G3H', voltage: '12.56V (Pro) / 8.4V (Air)', source: 'Charger + Battery via ISL6259', state: 'G3H (Always On)', check: 'Measure at L7130 inductor. Must be present with charger or battery connected. If missing: check charging IC ISL6259 and input fuse F7140.', color: '#ff6b6b' },
    { rail: 'PP3V42_G3H', voltage: '3.42V', source: 'PPBUS via U7090 LDO', state: 'G3H (Always On)', check: 'Measure at L7095. This powers the SMC. Without it, NO MagSafe light and NO boot attempt. If missing: U7090 is likely dead.', color: '#ffa94d' },
    { rail: 'SMC_PM_G2_EN', voltage: '3.3V (HIGH)', source: 'SMC Output', state: 'Power Button Press', check: 'SMC asserts this signal after detecting power button press. If stuck LOW: SMC is not receiving the keyboard/power button signal.', color: '#ffd43b' },
    { rail: 'PP3V3_S5', voltage: '3.3V', source: 'PPBUS via PMIC (U7501)', state: 'S5 (Soft Off)', check: 'Measure at test pad. Powers PCH RTC and suspend wells. If cycling repeatedly: a downstream S0 rail has a short.', color: '#69db7c' },
    { rail: 'PP5V_S5', voltage: '5.0V', source: 'PPBUS via Buck Converter', state: 'S5 (Soft Off)', check: 'Sister rail to PP3V3_S5. If PP3V3_S5 is present but this is missing, check the specific PMIC/regulator.', color: '#4dabf7' },
    { rail: 'PM_SLP_S4_L / S3_L', voltage: '3.3V (HIGH = Awake)', source: 'PCH/CPU Output', state: 'S3→S0 Transition', check: 'These signals from the CPU enable all remaining S0 power rails (CPU core, GPU, RAM). If stuck LOW: PCH or CPU failure, or missing prerequisite rail.', color: '#9775fa' },
    { rail: 'ALL_SYS_PWRGD', voltage: '3.3V', source: 'Power Good aggregator', state: 'S0 (Full On)', check: 'ALL power rails must send Power Good signals to the SMC. If this stays LOW, the SMC kills all non-G3H power. Trace which PG signal is missing.', color: '#e599f7' },
  ];

  const SYMPTOM_DATABASE: Record<string, { title: string, steps: string[], likelyCulprits: string[] }> = {
    'no-power': {
      title: 'Dead / No Power (0.00A)',
      steps: [
        '1. Check battery voltage with multimeter (should be >3.5V).',
        '2. If battery is good, check PP_BATT_VCC at the PMIC input.',
        '3. Measure PP1V8_ALWAYS — this standby rail must be present even when device is off.',
        '4. If PP1V8_ALWAYS is missing, check the PMIC and its input caps.',
        '5. If all standby rails are present but 0.00A, check the power button line to AP.',
        '6. CRITICAL: Plug into computer first to rule out DFU firmware trap!'
      ],
      likelyCulprits: ['PMIC (U2700)', 'Tristar/Hydra (U2)', 'Battery Connector Corrosion', 'Blown Main Fuse']
    },
    'bootloop': {
      title: 'Boot Loop / Apple Logo Stuck',
      steps: [
        '1. Observe ammeter pattern: Does current spike to 0.9A then drop to 0? (CPU attempting boot)',
        '2. Try DFU restore first — this is software 60% of the time.',
        '3. If restore fails with Error 4013/9, suspect NAND or baseband.',
        '4. Check I2C lines SDA/SCL with diode mode for shorts.',
        '5. If Audio IC area (U1400) is warm to touch, suspect Loop Disease.',
        '6. Disconnect front camera flex — a shorted proximity sensor causes phantom bootloops.'
      ],
      likelyCulprits: ['Audio IC (U1400)', 'NAND Flash', 'Front Camera Flex (Proximity)', 'Baseband PMIC']
    },
    'no-charge': {
      title: 'Not Charging / Fake Charging',
      steps: [
        '1. Check if lightning bolt appears but battery percentage drops (= Fake Charging = Tristar).',
        '2. Measure VBUS on the lightning/USB-C connector (should be 5V).',
        '3. Check Tristar (U2) / Hydra IC diode mode values against known-good.',
        '4. If VBUS is present but current is 0.00A, Tristar is not negotiating.',
        '5. Check for liquid damage indicators on the charge port flex.',
        '6. Verify Tiger/Tigris charge IC is producing PP_VCC_MAIN from battery.'
      ],
      likelyCulprits: ['Tristar / Hydra (U2)', 'Tigris Charge IC', 'Charge Port Flex', 'Cheap Non-MFi Cable Damage']
    },
    'no-display': {
      title: 'No Display / Backlight Failure',
      steps: [
        '1. Connect to iTunes/Finder — if device is recognized, the board boots fine; display circuit is the issue.',
        '2. Shine flashlight through screen — if you see a dim image, backlight circuit is dead but LCD works.',
        '3. Check backlight coil (L7001 area) for continuity.',
        '4. Measure cathode voltage on backlight driver IC.',
        '5. Check FPC display connector pins for bent/missing pins or corrosion.',
        '6. Swap with known-good screen to isolate board vs screen fault.'
      ],
      likelyCulprits: ['Backlight Filter (FL7001)', 'Backlight Driver IC', 'Display Connector (J4300)', 'Backlight Coil (L7001)']
    },
    'no-service': {
      title: 'No Service / Searching...',
      steps: [
        '1. Check if IMEI shows in Settings > About. If "Unknown" = baseband is dead.',
        '2. Restore firmware — baseband firmware can corrupt independently.',
        '3. If IMEI shows but no signal, check antenna flex connections.',
        '4. Measure baseband PMIC output rails.',
        '5. Check for water damage around the SIM card reader area.',
        '6. On iPhone 7+, this is commonly a baseband IC (MDM9645M) failure.'
      ],
      likelyCulprits: ['Baseband Modem IC', 'Baseband PMIC', 'Antenna Flex Connector', 'SIM Card Reader']
    },
    'overheating': {
      title: 'Device Gets Extremely Hot',
      steps: [
        '1. Identify WHERE the heat originates (near CPU? Near PMIC? Near charge port?).',
        '2. If near PMIC area, check all main rail capacitors for shorts.',
        '3. Use thermal camera or freeze spray to isolate the exact component.',
        '4. Measure standby current with ammeter — should be <100mA when idle.',
        '5. If drawing >500mA in standby, there is a partial short on a main rail.',
        '6. Inject voltage into the shorted rail and use thermal camera to find the culprit.'
      ],
      likelyCulprits: ['Shorted Decoupling Capacitor', 'PMIC (U2700)', 'CPU Underfill Damage', 'Charge IC Drawing Excessive Current']
    },
    'mb-no-magsafe': {
      title: 'MacBook: No MagSafe / USB-C Light',
      steps: [
        '1. Verify charger is known-good — test with another MacBook or use a USB-C power meter.',
        '2. Check for PPBUS_G3H at L7130. If 0V: Input fuse F7140 might be blown, or ISL6259 charging IC is dead.',
        '3. If PPBUS is present, check PP3V42_G3H at L7095. This rail powers the SMC which controls charger identification.',
        '4. SMC uses PP3V42_G3H to run the "one-wire" charger identification circuit. If this circuit fails, the MagSafe LED never turns on.',
        '5. Check for liquid damage around the MagSafe/USB-C connector — corrosion here is extremely common.',
        '6. On USB-C MacBooks, check CD3217 controller IC. If stuck at 5V 0A, the controller cannot negotiate 20V PD.'
      ],
      likelyCulprits: ['ISL6259 Charge Controller', 'U7090 LDO (PP3V42)', 'SMC (one-wire failure)', 'CD3217 USB-C Controller', 'Input Fuse F7140']
    },
    'mb-fan-spin-no-boot': {
      title: 'MacBook: Fan Spins but No Chime / No Display',
      steps: [
        '1. Fan spinning = PPBUS_G3H and PP3V42_G3H are present, SMC is alive.',
        '2. Check PP3V3_S5 and PP5V_S5 — these must be present for the PCH to wake.',
        '3. Verify PM_SLP_S4_L is going HIGH after power button press. If stuck LOW: PCH is not transitioning.',
        '4. Check ALL_SYS_PWRGD — if LOW, one of the S0 power rails is failing its Power Good check. Trace upstream.',
        '5. If all rails look good, suspect CPU/GPU failure (especially on 2016-2019 models with known GPU flexgate issues).',
        '6. Try connecting an external display via USB-C/HDMI. If external works: backlight/display cable issue (flexgate).'
      ],
      likelyCulprits: ['GPU / Flexgate (2016-2019)', 'CPU Core VDD Short', 'Missing ALL_SYS_PWRGD', 'T2 Chip Failure (2018+)', 'Display Flex Cable']
    },
    'mb-liquid-damage': {
      title: 'MacBook: Liquid Damage Recovery',
      steps: [
        '1. IMMEDIATELY disconnect battery and charger. Do NOT attempt to power on.',
        '2. Remove the logic board and inspect under magnification for corrosion, green/white deposits.',
        '3. Clean the ENTIRE board in a 99% isopropyl alcohol ultrasonic bath for 5-10 minutes.',
        '4. After drying (24-48hrs or compressed air), measure all major power rails for shorts.',
        '5. Pay special attention to PPBUS_G3H, PP3V42_G3H, PP3V3_S5 — liquid commonly shorts these rail caps.',
        '6. Replace any visibly corroded or damaged components. Check under BGA ICs with thermal camera for hidden shorts.'
      ],
      likelyCulprits: ['Corroded Decoupling Capacitors', 'Keyboard Backlight Circuit', 'Trackpad Connector', 'PMIC Area', 'USB-C Port Connector Pins']
    },
    // ==================== RAZER BLADE ====================
    'rz-no-power': {
      title: 'Razer Blade: Won\'t Power On',
      steps: [
        '1. Check if charging LED comes on when charger is plugged in. No LED = check 19V DC input rail.',
        '2. Try a hard reset: disconnect charger, hold power button for 30 seconds, reconnect charger.',
        '3. If still dead, check for the fan screw proximity short (Blade 14 design flaw) — look for burnt PCB near fan mount.',
        '4. Measure 19V input rail. If 0V at the board: check input fuse, barrel jack solder joints, or internal cable.',
        '5. If 19V is present but no boot: EC may be hung. Try disconnecting battery for 5 minutes then reconnecting.',
        '6. If battery is severely swollen, it may have disconnected internally. Remove battery and try AC-only boot.'
      ],
      likelyCulprits: ['19V Rail Proximity Short', 'Swollen Battery', 'EC Firmware Hang', 'Input Fuse', 'VRM MOSFET Failure']
    },
    'rz-overheating': {
      title: 'Razer Blade: Extreme Overheating / Throttling',
      steps: [
        '1. Check if fans spin but exhaust air is lukewarm → vapor chamber failure (Blade 16/18 2023-2024).',
        '2. If exhaust is hot and fans spin normally: clean dust from intake (bottom) and exhaust (side) vents.',
        '3. Repaste CPU/GPU with high-quality thermal compound (PTM7950 or Thermal Grizzly Kryonaut).',
        '4. Replace dried-out thermal pads on VRM MOSFETs and VRAM chips.',
        '5. In Synapse: set performance mode to "Balanced" and cap frame rates to reduce thermal load.',
        '6. If VRM area is scorching hot to touch but CPU/GPU temps are manageable: VRM MOSFET failure imminent.'
      ],
      likelyCulprits: ['Vapor Chamber Failure', 'Dried Thermal Paste/Pads', 'Dust Blockage', 'VRM MOSFET Degradation', 'Synapse Performance Profile']
    },
    'rz-battery-swell': {
      title: 'Razer Blade: Battery Swelling',
      steps: [
        '1. SAFETY FIRST: Do not puncture, charge, or continue using the swollen battery.',
        '2. Symptoms: trackpad lifting, keyboard popping up, laptop rocking on flat surface, split seams.',
        '3. Power off immediately and disconnect the charger.',
        '4. Remove the battery (T5 Torx screws on bottom panel, then T5 screws on battery).',
        '5. Store swollen battery in a fireproof container away from heat sources until proper disposal.',
        '6. Laptop will run fine on AC power without battery. Order OEM replacement (2022+ models have charge limiter to prevent recurrence).'
      ],
      likelyCulprits: ['Lithium-Ion Electrolyte Decomposition', 'Heat Stress (Gaming w/ Charging)', 'Battery Age (3-5 years)', 'No Charge Limiter (Pre-2022 Models)']
    },
    // ==================== ASUS ROG ====================
    'asus-no-power': {
      title: 'ASUS ROG: Won\'t Power On',
      steps: [
        '1. Try EC reset: Hold Ctrl + Shift + R while pressing power button for 10-15 seconds.',
        '2. Disconnect all peripherals. Remove RAM and reseat. Try with single stick in slot A.',
        '3. Check charger output with multimeter (should read 19-20V). Try barrel jack if normally using USB-C.',
        '4. Perform hard reset: disconnect charger, hold power for 40 seconds to drain capacitors.',
        '5. Inspect motherboard for burn marks near fan screw area (ROG Strix G16 2023/2024 burnout issue).',
        '6. If all LEDs are dead with no signs of life: check 19V input rail MOSFETs for dead short.'
      ],
      likelyCulprits: ['EC Controller Hang', 'Fan Screw Burnout (Strix G16)', 'Charger/Cable Failure', '19V Input MOSFET Short', 'RAM Not Seated']
    },
    'asus-gpu-issues': {
      title: 'ASUS ROG: GPU Not Detected / Artifacts / Crashes',
      steps: [
        '1. First rule out software: clean uninstall GPU drivers using DDU in Safe Mode, then reinstall.',
        '2. Check Device Manager → Display Adapters. If GPU shows Error 43 = hardware failure likely.',
        '3. Connect external monitor. If external works but internal is black: MUX switch failure, not GPU.',
        '4. Reset BIOS to defaults (especially if any CPU/Memory overclocking was applied).',
        '5. WHEA 0x124 crashes or black screens during gaming = PCIe link desync during power transitions. Often a VRM issue, not GPU.',
        '6. If GPU draws excessive power at idle (check with HWiNFO): VRM capacitor is likely shorted.'
      ],
      likelyCulprits: ['VRM Phase Failure (not GPU)', 'MUX Switch IC', 'PCIe Link Desync', 'Driver Corruption', 'Overheating (Repaste Needed)']
    },
    // ==================== LENOVO LEGION ====================
    'len-no-power': {
      title: 'Lenovo Legion: Dead / No Power',
      steps: [
        '1. Try the Novo button (pinhole on side) with a paperclip — if BIOS menu appears, the board boots fine.',
        '2. Check charger output: should read 20V on multimeter for slim-tip chargers.',
        '3. Perform power drain: disconnect charger, hold power for 60 seconds, reconnect.',
        '4. If the laptop made a "pop" sound before dying: a VRM MOSFET has likely blown. Look for burn marks.',
        '5. Listen for fan spin on power press. If fans spin briefly then stop: missing power rail or EC reset needed.',
        '6. CRITICAL: AMD Ryzen 5000 Legion boards (NM-D562/NM-D563) have epidemic solder joint failure. If completely dead = likely needs CPU/GPU reball.'
      ],
      likelyCulprits: ['BGA Solder Joint Failure (AMD)', 'VRM MOSFET Blowout', 'Charger/Cable Failure', 'EC Controller Hang', 'Slim-Tip Connector Damage']
    },
    'len-gpu-missing': {
      title: 'Lenovo Legion: dGPU Not Detected',
      steps: [
        '1. FIRST CHECK: Open Lenovo Vantage → Disable "Hybrid Mode". This is the #1 false alarm for missing GPU.',
        '2. If still missing, open Device Manager → Display Adapters. Error 43 = hardware failure.',
        '3. Clean uninstall GPU drivers with DDU in Safe Mode. Reinstall from Nvidia/AMD directly.',
        '4. Check BIOS: ensure dGPU is enabled and PCIe slot is set to Gen 3/4 (not disabled).',
        '5. Run power drain (60 second hold). Sometimes GPU disappears after sleep/resume cycles.',
        '6. If GPU disappears repeatedly after thermal stress (gaming sessions): BGA solder joint failure. Needs reball.'
      ],
      likelyCulprits: ['Hybrid Mode Enabled (Software)', 'BGA Solder Joint Failure', 'Driver Corruption', 'BIOS Setting Disabled', 'PCIe Link Failure']
    }
  };

  const runSymptomWizard = () => {
    if (!selectedSymptom || !SYMPTOM_DATABASE[selectedSymptom]) return;
    setWizardResult(SYMPTOM_DATABASE[selectedSymptom]);
  };

  const AMMETER_STAGES = [
    { min: 0, max: 0.01, stage: 'STAGE 0: Dead', status: 'critical', suspects: ['No input power', 'Blown fuse', 'PMIC not triggering', 'Firmware DFU trap'], action: 'Check standby rails (PP1V8_ALWAYS, PP3V0_NAND). Plug into computer to rule out DFU before hardware diagnosis.' },
    { min: 0.01, max: 0.15, stage: 'STAGE 1: Standby', status: 'warning', suspects: ['Boot trigger missing', 'Power button line broken', 'PMIC not generating VCC_MAIN'], action: 'Device has standby power but is not attempting to boot. Check power button flex and AP_HOLD_KEY line to PMIC.' },
    { min: 0.15, max: 0.45, stage: 'STAGE 2: CPU Init', status: 'warning', suspects: ['Missing secondary rail', 'I2C line short', 'NAND communication failure', 'Proximity sensor short'], action: 'CPU attempted boot but stalled. Check I2C lines, NAND rails, and disconnect front camera flex to test.' },
    { min: 0.45, max: 0.85, stage: 'STAGE 3: Peripheral Init', status: 'info', suspects: ['Display driver failure', 'Baseband PMIC fault', 'Audio IC (Loop Disease)'], action: 'Board is booting peripherals but stalling. Likely a secondary IC failure. Disconnect screen/cameras and retest.' },
    { min: 0.85, max: 1.5, stage: 'STAGE 4: Full Boot', status: 'pass', suspects: ['Software issue if screen is black', 'Backlight circuit if no display', 'Likely healthy if screen shows'], action: 'Board is drawing full boot current. If no display, suspect backlight circuit. If display works, likely a software / restore issue.' },
    { min: 1.5, max: 99, stage: 'STAGE X: Overcurrent', status: 'critical', suspects: ['Major short circuit', 'PMIC failure', 'CPU VDD short', 'Catastrophic liquid damage'], action: 'DANGER: Immediately disconnect power. Board has a severe short. Use voltage injection + thermal camera to locate.' }
  ];

  const runAmmeterAnalysis = () => {
    const amps = parseFloat(ammeterReading);
    if (isNaN(amps) || amps < 0) return;
    const match = AMMETER_STAGES.find(s => amps >= s.min && amps < s.max);
    if (match) {
      setAmmeterResult({ stage: match.stage, status: match.status, suspects: match.suspects, action: match.action });
    }
  };

  const runInjectionCalc = () => {
    const ohms = parseFloat(injOhms);
    if (isNaN(ohms) || ohms <= 0) return;

    // Ohms law smart injection limit
    const safeVolts = 1.0;
    const drawAmps = safeVolts / ohms;
    const heatWatts = safeVolts * drawAmps;

    setInjResult({
      volts: safeVolts.toFixed(1) + 'V',
      amps: drawAmps.toFixed(2) + 'A',
      temp: heatWatts > 2 ? 'HOT 🔴' : (heatWatts > 0.5 ? 'WARM 🟡' : 'COLD 🔵')
    });
  };

  const runDeviationCalc = () => {
    const known = parseFloat(calcKnown);
    const reading = parseFloat(calcReading);
    if (isNaN(known) || isNaN(reading)) return;

    const diff = Math.abs(known - reading);
    const percentage = (diff / known) * 100;

    if (percentage > 10) {
      setCalcResult({ dev: percentage.toFixed(1) + '%', alert: true, msg: 'DANGER: >10% Deviation. Highly likely a partial short or broken trace. Do not power on.' });
    } else {
      setCalcResult({ dev: percentage.toFixed(1) + '%', alert: false, msg: 'PASS: Within 10% thermal/multimeter variance tolerance. Likely okay.' });
    }
  };

  const [customReadings, setCustomReadings] = useState<CustomReading[]>(() => {
    const saved = localStorage.getItem('boardx_custom_db');
    return saved ? JSON.parse(saved) : [];
  });

  const saveReading = () => {
    if (!newReading.component) return;
    const reading: CustomReading = {
      id: Date.now().toString(),
      board: mockBoards.find(b => b.id === selectedBoard)?.name || 'Unknown',
      component: newReading.component,
      measuredOhms: newReading.ohms,
      measuredDiode: newReading.diode,
      notes: newReading.notes,
      date: new Date().toLocaleDateString()
    };
    const updated = [reading, ...customReadings];
    setCustomReadings(updated);
    localStorage.setItem('boardx_custom_db', JSON.stringify(updated));
    setNewReading({ component: '', ohms: '', diode: '', notes: '' });
  };

  const filteredData = useMemo(() => {
    return mockBoardData.filter(point =>
      point.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'power': return 'var(--accent-orange)';
      case 'data': return 'var(--accent-blue)';
      case 'critical': return 'var(--accent-red)';
      default: return 'var(--accent-cyan)';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar glass-panel">
        <div className="sidebar-brand">
          <h1 className="glow">⚡ BoardX <span>PRO</span></h1>
        </div>
        <div className="sidebar-menu">
          <button className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`} onClick={() => setActiveTab('diagnostics')}>
            <span className="nav-icon">🔬</span> Diagnostics
          </button>
          <button className={`nav-item ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
            <span className="nav-icon">💾</span> My Database
          </button>
          <button className={`nav-item ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>
            <span className="nav-icon">🌐</span> Community Q&A
          </button>
          <button className={`nav-item ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
            <span className="nav-icon">🧰</span> Smart Tools {userTier === 'elite' ? <span className="pro-badge-small" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff' }}>ELITE</span> : <span className="pro-badge-small">PRO</span>}
          </button>
          <button className={`nav-item ${activeTab === 'pricing' as string ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>
            <span className="nav-icon">💎</span> Plans & Pricing
          </button>
        </div>

        <div className="sidebar-footer">
          <div style={{ marginBottom: 15, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#000' }}>W</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Will Repairs</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>tech@boardx.pro</div>
              </div>
            </div>
          </div>
          {userTier === 'free' && (
            <button className="pro-toggle-btn" onClick={() => setActiveTab('pricing')}>Upgrade Now</button>
          )}
          {userTier === 'pro' && (
            <button className="pro-toggle-btn active" onClick={() => setActiveTab('pricing')}>
              ⚡ PRO Active
            </button>
          )}
          {userTier === 'elite' && (
            <button className="pro-toggle-btn active" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)' }} onClick={() => setActiveTab('pricing')}>
              👑 ELITE Active
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="app-header glass-panel">
          <div className="header-left">
            <select className="board-selector" title="Select board" value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)}>
              {mockBoards.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="header-right">
            {(activeTab === 'diagnostics') && (
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search Component ID (e.g. C4201)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
        </header>

        <main className="main-content">
          {/* TAB 1: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <>
              <section className="components-list glass-panel">
                <div className="list-header">
                  <h2>Test Points ({filteredData.length})</h2>
                </div>
                <div className="list-body">
                  {filteredData.length === 0 ? (
                    <div className="empty-state">No components found</div>
                  ) : (
                    filteredData.map(point => (
                      <div
                        key={point.id}
                        className={`list-item ${selectedPoint?.id === point.id ? 'selected' : ''} ${point.isPro && !isProUser ? 'locked' : ''}`}
                        onClick={() => {
                          if (point.isPro && !isProUser) {
                            alert("This technical data requires BoardX PRO or ELITE. Redirecting to plans...");
                            setActiveTab('pricing');
                          } else {
                            setSelectedPoint(point);
                          }
                        }}
                      >
                        <div className="item-icon" style={{ backgroundColor: getStatusColor(point.status) }}></div>
                        <div className="item-info">
                          <span className="item-id">{point.id} {point.isPro && <span className="pro-badge-small">PRO</span>}</span>
                          <span className="item-name">{point.name}</span>
                        </div>
                        {point.isPro && !isProUser ? <div className="lock-icon">🔒</div> : <div className="item-type">{point.type}</div>}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="component-details glass-panel interactive">
                {selectedPoint ? (
                  <div className="layout-split">
                    <div className="details-card">
                      {selectedPoint.status === 'power' && (
                        <div className="dfu-warning-banner">
                          <strong>⚠️ CRITICAL FIRMWARE CHECK:</strong> Before attributing this power rail failure to a hardware short, please connect the device to a computer. Ensure it is not stuck in a firmware loop (DFU/Recovery mode) showing 0.00A on your ammeter.
                        </div>
                      )}
                      <div className="card-header">
                        <h2>{selectedPoint.id}</h2>
                        <span className="badge" style={{ borderColor: getStatusColor(selectedPoint.status), color: getStatusColor(selectedPoint.status) }}>
                          {selectedPoint.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="card-subtitle">{selectedPoint.name} ({selectedPoint.type})</h3>

                      <div className="readings-grid">
                        <div className="reading-box">
                          <span className="reading-label">Resistance to Gnd (Ω)</span>
                          <span className="reading-value ohms">{selectedPoint.ohmsGround}</span>
                        </div>
                        <div className="reading-box">
                          <span className="reading-label">Diode Mode (mV)</span>
                          <span className="reading-value diode">{selectedPoint.diodeMode}</span>
                        </div>
                      </div>

                      <div className="description-box">
                        <h4>Diagnosis Intel</h4>
                        <p>{selectedPoint.description}</p>
                      </div>

                      <div className="pro-tools-teaser" style={{ position: 'relative', overflow: 'hidden' }}>
                        <h4>✨ Fault Finder Wizard</h4>
                        <div className={`wizard-unlocked ${!isProUser ? 'blurred-wizard' : ''}`}>
                          <p>1. Check voltage at {selectedPoint.id} pad 1.</p>
                          <p>2. If 0V, inject 1V at 1A and check for thermal hotspots.</p>
                          <p>3. Trace the VDD_MAIN drop to the PMIC region.</p>
                          <button className="run-wizard-btn" disabled={!isProUser}>Start Live Diagnostic</button>
                        </div>
                        {!isProUser && (
                          <div className="teaser-overlay-upgrade">
                            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>PRO Diagnostic Tree Locked</p>
                            <button className="upgrade-block-btn" style={{ width: '200px', margin: '0 auto' }} onClick={() => setIsCheckoutOpen(true)}>
                              Unlock Wizard
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="board-visualizer-container">
                      <div className="board-header">
                        Interactive Schematic
                        {!isProUser && <span className="pro-badge-small">Preview Only</span>}
                      </div>
                      <div className={`board-map ${!isProUser ? 'blurred' : ''}`}>
                        <TransformWrapper initialScale={1} minScale={1} maxScale={10} disabled={!isProUser}>
                          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="board-svg">
                              <image href="/logic_board_mock.png" x="0" y="0" width="100" height="100" />
                              {mockBoardData.map(p => {
                                if (p.isPro && !isProUser) return null;
                                const isSelected = selectedPoint.id === p.id;
                                return (
                                  <g key={p.id} onClick={() => setSelectedPoint(p)} style={{ cursor: 'pointer' }}>
                                    <circle cx={p.x} cy={p.y} r={isSelected ? "3" : "1.5"} fill={getStatusColor(p.status)} className={isSelected ? "glow-svg" : ""} />
                                    {isSelected && (
                                      <circle cx={p.x} cy={p.y} r="5" fill="none" stroke={getStatusColor(p.status)} strokeWidth="0.5">
                                        <animate attributeName="r" values="3; 8" dur="1.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="1; 0" dur="1.5s" repeatCount="indefinite" />
                                      </circle>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                          </TransformComponent>
                        </TransformWrapper>
                        {!isProUser && (
                          <div className="lock-overlay">
                            <div className="lock-icon-large">🔒</div>
                            <p>Interactive Vector Schematics require PRO</p>
                            <button onClick={() => setIsCheckoutOpen(true)}>Upgrade Now</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <div className="idle-animation"><span></span><span></span><span></span></div>
                    <h3>Awaiting Component Selection</h3>
                    <p>Select a test point from the list to view its expected readings and diagnostics intel.</p>
                  </div>
                )}
              </section>
            </>
          )}

          {/* TAB 2: MY DATABASE */}
          {activeTab === 'database' && (
            <div className="db-tab glass-panel">
              <div className="db-header">
                <h2>💾 Local Private Database</h2>
                <p>Save your own successful diode readings and resistance measurements offline. Data is instantly accessible.</p>
              </div>

              <div className="db-content">
                <div className="db-form">
                  <h3>Record New Reading</h3>
                  <input type="text" placeholder="Component ID (e.g. U3200)" value={newReading.component} onChange={e => setNewReading({ ...newReading, component: e.target.value })} />
                  <div className="split-inputs">
                    <input type="text" placeholder="Ohms to Gnd" value={newReading.ohms} onChange={e => setNewReading({ ...newReading, ohms: e.target.value })} />
                    <input type="text" placeholder="Diode Mode (mV)" value={newReading.diode} onChange={e => setNewReading({ ...newReading, diode: e.target.value })} />
                  </div>
                  <textarea placeholder="Diagnostic Notes (e.g., Shorted after drop, replaced IC)" value={newReading.notes} onChange={e => setNewReading({ ...newReading, notes: e.target.value })}></textarea>
                  <button className="save-db-btn" onClick={saveReading}>Commit to Database</button>
                </div>

                <div className="db-table-wrapper">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Board</th>
                        <th>Component</th>
                        <th>Ohms (Ω)</th>
                        <th>Diode (mV)</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customReadings.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', opacity: 0.5 }}>No custom readings recorded yet.</td></tr>
                      ) : (
                        customReadings.map(reading => (
                          <tr key={reading.id}>
                            <td>{reading.date}</td>
                            <td>{reading.board}</td>
                            <td className="comp-col">{reading.component}</td>
                            <td className="ohms-col">{reading.measuredOhms || '-'}</td>
                            <td className="diode-col">{reading.measuredDiode || '-'}</td>
                            <td>{reading.notes || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMUNITY Q&A */}
          {activeTab === 'community' && (
            <div className="qa-tab glass-panel">
              <div className="qa-header">
                <h2>🌐 Global Repair Community</h2>
                <p>Ask questions, share solutions, and help technicians around the world.</p>
                <div className="qa-actions">
                  <input type="text" placeholder="Search discussions..." className="qa-search" />
                  <button className="ask-btn">Ask Question</button>
                </div>
              </div>
              <div className="qa-threads">
                {mockCommunityQA.map(thread => (
                  <div key={thread.id} className="qa-thread-card">
                    <div className="qa-votes">
                      <div className="up-arrow">▲</div>
                      <span className="vote-num">{thread.upvotes}</span>
                      <div className="down-arrow">▼</div>
                    </div>
                    <div className="qa-content">
                      <div className="qa-meta">
                        <span className="qa-author">{thread.author}</span>
                        <span className="qa-board-tag">{mockBoards.find(b => b.id === thread.board)?.name}</span>
                        {thread.isSolved && <span className="qa-solved-tag">✓ Solved</span>}
                      </div>
                      <h3>{thread.title}</h3>
                      <p>{thread.content}</p>
                      <div className="qa-footer">
                        <span>💬 {thread.replies} Replies</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* TAB 4: PRO SMART TOOLS */}
          {activeTab === 'tools' && (
            <div className="tools-tab glass-panel">
              <div className="tools-header">
                <h2>🧰 PRO Technician Toolkit</h2>
                <p>Calculators and Firmware verification logic to prevent unnecessary board repairs.</p>
              </div>

              {!isProUser ? (
                <div className="lock-overlay" style={{ position: 'relative', height: '400px', transform: 'none', top: '0', left: '0', marginTop: '20px' }}>
                  <div className="lock-icon-large">🔒</div>
                  <p>Smart Tools require BoardX PRO or ELITE</p>
                  <button onClick={() => setActiveTab('pricing')}>View Plans</button>
                </div>
              ) : (
                <div className="tools-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="tool-card">
                    <h3>Smart Diode Deviation Calculator</h3>
                    <p className="tool-desc">Multimeters vary. Enter your reading vs the schematic reading to see if the deviation indicates a true short or just thermal variance.</p>
                    <div className="calculator-ui">
                      <input type="number" placeholder="Known Good (mV)" className="calc-input" value={calcKnown} onChange={e => setCalcKnown(e.target.value)} />
                      <input type="number" placeholder="Your Reading (mV)" className="calc-input" value={calcReading} onChange={e => setCalcReading(e.target.value)} />
                      <button className="calc-btn" onClick={runDeviationCalc}>Analyze Deviation</button>
                      {calcResult && (
                        <div className={`calc-result ${calcResult.alert ? 'alert' : 'pass'}`}>
                          <strong>Deviation: {calcResult.dev}</strong>
                          <p>{calcResult.msg}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tool-card">
                    <h3>Smart Voltage Injection Limits (Ohm's Law)</h3>
                    <p className="tool-desc">Enter the resistance of the shorted line to calculate the absolute max safe limits for your DC Power Supply.</p>
                    <div className="calculator-ui">
                      <input type="number" placeholder="Short Resistance (Ω)" className="calc-input" value={injOhms} onChange={e => setInjOhms(e.target.value)} />
                      <button className="calc-btn" onClick={runInjectionCalc}>Calculate Limits</button>
                      {injResult && (
                        <div className="calc-result" style={{ background: 'rgba(57, 211, 83, 0.1)' }}>
                          <p>Set PSU Voltage to: <strong>{injResult.volts} max</strong></p>
                          <p>Expected Current: <strong>{injResult.amps} draw</strong></p>
                          <p>Thermal Camera Profile: <strong>{injResult.temp}</strong></p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tool-card">
                    <h3>Firmware vs Hardware Flowchart</h3>
                    <p className="tool-desc">Often dead MacBooks/iPhones are just stuck in DFU. Verify DFU state before lifting any ICs.</p>
                    <ul className="cheat-sheet">
                      <li>👉 <strong>MacBook (T2/M-Series):</strong> Plug into Apple Configurator 2. Check for "DFU" status.</li>
                      <li>👉 <strong>iPhone:</strong> Ammeter reads 0.00A? Connect to 3uTools and check for Recovery Mode.</li>
                      <li>👉 <strong>Error 4013:</strong> Usually indicates a dead NAND or broken I2C line, not necessarily a completely dead logic board.</li>
                    </ul>
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3' }}>
                    <h3>⚡ Ammeter Boot Sequence Analyzer</h3>
                    <p className="tool-desc">Enter your DC ammeter reading (Amps) when the phone attempts to boot. The analyzer will identify exactly which boot stage the CPU is stuck at and what components to investigate.</p>
                    <div className="calculator-ui">
                      <input type="number" step="0.01" placeholder="Ammeter Reading (A) e.g. 0.45" className="calc-input" value={ammeterReading} onChange={e => setAmmeterReading(e.target.value)} />
                      <button className="calc-btn" onClick={runAmmeterAnalysis}>Analyze Boot Stage</button>
                      {ammeterResult && (
                        <div className={`calc-result ${ammeterResult.status === 'critical' ? 'alert' : ammeterResult.status === 'pass' ? 'pass' : ''}`} style={ammeterResult.status === 'warning' ? { background: 'rgba(255,171,112,0.1)', border: '1px solid var(--accent-orange)' } : ammeterResult.status === 'info' ? { background: 'rgba(0,122,255,0.1)', border: '1px solid var(--accent-blue)' } : {}}>
                          <strong>{ammeterResult.stage}</strong>
                          <p style={{ marginTop: 8 }}>{ammeterResult.action}</p>
                          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {ammeterResult.suspects.map((s, i) => (
                              <span key={i} style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3' }}>
                    <h3>🩺 Symptom-Based Diagnostic Wizard</h3>
                    <p className="tool-desc">Select the primary symptom the customer's device is experiencing. The wizard will generate a step-by-step diagnostic tree and list the most likely component failures.</p>
                    <div className="calculator-ui">
                      <select className="calc-input" title="Select device symptom" value={selectedSymptom} onChange={e => { setSelectedSymptom(e.target.value); setWizardResult(null); }} style={{ cursor: 'pointer' }}>
                        <option value="">-- Select Symptom --</option>
                        <optgroup label="📱 iPhone / Mobile">
                          <option value="no-power">💀 Dead / No Power (0.00A on ammeter)</option>
                          <option value="bootloop">🔄 Boot Loop / Stuck on Apple Logo</option>
                          <option value="no-charge">🔌 Not Charging / Fake Charging</option>
                          <option value="no-display">🖥️ No Display / No Backlight</option>
                          <option value="no-service">📡 No Service / Searching...</option>
                          <option value="overheating">🌡️ Overheating</option>
                        </optgroup>
                        <optgroup label="💻 MacBook / Laptop">
                          <option value="mb-no-magsafe">🔋 No MagSafe / USB-C Light</option>
                          <option value="mb-fan-spin-no-boot">💨 Fan Spins but No Chime / No Display</option>
                          <option value="mb-liquid-damage">💧 Liquid Damage Recovery</option>
                        </optgroup>
                        <optgroup label="🎮 Razer Blade">
                          <option value="rz-no-power">💀 Won't Power On</option>
                          <option value="rz-overheating">🔥 Extreme Overheating / Throttling</option>
                          <option value="rz-battery-swell">⚠️ Battery Swelling</option>
                        </optgroup>
                        <optgroup label="🎮 ASUS ROG">
                          <option value="asus-no-power">💀 Won't Power On</option>
                          <option value="asus-gpu-issues">🖥️ GPU Not Detected / Artifacts</option>
                        </optgroup>
                        <optgroup label="🎮 Lenovo Legion">
                          <option value="len-no-power">💀 Dead / No Power</option>
                          <option value="len-gpu-missing">🖥️ dGPU Not Detected</option>
                        </optgroup>
                      </select>
                      <button className="calc-btn" onClick={runSymptomWizard}>Run Diagnostic Wizard</button>
                      {wizardResult && (
                        <div className="calc-result pass" style={{ textAlign: 'left' }}>
                          <strong style={{ fontSize: 18, color: 'var(--accent-cyan)' }}>{wizardResult.title}</strong>
                          <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {wizardResult.steps.map((step, i) => (
                              <p key={i} style={{ fontSize: 13, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, borderLeft: '3px solid var(--accent-cyan)' }}>{step}</p>
                            ))}
                          </div>
                          <h4 style={{ marginTop: 18, fontSize: 14, color: 'var(--accent-orange)' }}>🔍 Most Likely Culprits:</h4>
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {wizardResult.likelyCulprits.map((c, i) => (
                              <span key={i} style={{ background: 'rgba(248,81,73,0.15)', color: 'var(--accent-red)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3', border: isEliteUser ? '1px solid rgba(245,175,25,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <h3>💻 MacBook Power Sequence Tracer <span className="pro-badge-small" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff', fontSize: 9, marginLeft: 6 }}>ELITE</span></h3>
                    <p className="tool-desc">Walk through the MacBook power-on sequence rail by rail. Each step shows the expected voltage, the source IC, and what to check if it's missing.</p>
                    {!isEliteUser ? (
                      <div className="lock-overlay" style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>👑</div>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>Tracer Requires ELITE Tier</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 15 }}>Master the MacBook power flow with interactive diagrams.</p>
                        <button className="calc-btn" onClick={() => setActiveTab('pricing')}>Upgrade to Elite</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 15 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 15, flexWrap: 'wrap' }}>
                          {MACBOOK_POWER_SEQUENCE.map((step, i) => (
                            <button
                              key={i}
                              onClick={() => setSequenceStep(i)}
                              style={{
                                padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                                background: i === sequenceStep ? step.color : 'rgba(255,255,255,0.06)',
                                color: i === sequenceStep ? '#000' : 'var(--text-secondary)',
                                transition: 'all 0.2s'
                              }}
                            >
                              {i + 1}. {step.rail}
                            </button>
                          ))}
                        </div>
                        {(() => {
                          const step = MACBOOK_POWER_SEQUENCE[sequenceStep];
                          return (
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${step.color}`, borderRadius: 12, padding: 20 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <strong style={{ fontSize: 18, color: step.color }}>{step.rail}</strong>
                                <span style={{ background: step.color, color: '#000', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{step.state}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 15 }}>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Expected Voltage:</span> <strong>{step.voltage}</strong></div>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Source:</span> <strong>{step.source}</strong></div>
                              </div>
                              <p style={{ fontSize: 13, lineHeight: 1.6, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${step.color}` }}>{step.check}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15 }}>
                                <button className="calc-btn" style={{ flex: 1, marginRight: 8 }} onClick={() => setSequenceStep(Math.max(0, sequenceStep - 1))} disabled={sequenceStep === 0}>← Previous Rail</button>
                                <button className="calc-btn" style={{ flex: 1 }} onClick={() => setSequenceStep(Math.min(MACBOOK_POWER_SEQUENCE.length - 1, sequenceStep + 1))} disabled={sequenceStep === MACBOOK_POWER_SEQUENCE.length - 1}>Next Rail →</button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3', border: isEliteUser ? '1px solid rgba(245,175,25,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <h3>💧 Liquid Damage Assessment Tool <span className="pro-badge-small" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff', fontSize: 9, marginLeft: 6 }}>ELITE</span></h3>
                    <p className="tool-desc">Check all symptoms you observe during visual inspection. The tool calculates a severity score and provides a repair recommendation.</p>
                    {!isEliteUser ? (
                      <div className="lock-overlay" style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>💧</div>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>Elite Assessment Tool Locked</p>
                        <button className="calc-btn" onClick={() => setActiveTab('pricing')}>Upgrade to Elite</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 15 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {LIQUID_DAMAGE_CHECKLIST.map(item => (
                            <label
                              key={item.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                                background: liquidChecks[item.id] ? (
                                  item.severity === 'critical' ? 'rgba(248,81,73,0.15)' :
                                    item.severity === 'high' ? 'rgba(255,171,112,0.1)' :
                                      'rgba(255,255,255,0.05)'
                                ) : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${liquidChecks[item.id] ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                transition: 'all 0.2s'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={!!liquidChecks[item.id]}
                                onChange={() => setLiquidChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                style={{ width: 18, height: 18, accentColor: 'var(--accent-blue)' }}
                              />
                              <span>{item.label}</span>
                              <span style={{
                                marginLeft: 'auto', fontSize: 11, fontWeight: 600, color:
                                  item.severity === 'critical' ? 'var(--accent-red)' :
                                    item.severity === 'high' ? 'var(--accent-orange)' :
                                      item.severity === 'medium' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                              }}>{item.severity.toUpperCase()}</span>
                            </label>
                          ))}
                          {(() => {
                            const score = getLiquidDamageScore();
                            const verdict = getLiquidDamageVerdict(score);
                            return (
                              <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, borderLeft: `4px solid ${verdict.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                  <strong style={{ fontSize: 16 }}>Damage Score</strong>
                                  <span style={{ fontSize: 28, fontWeight: 800, color: verdict.color }}>{score}%</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.1)', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                                  <div style={{ background: verdict.color, height: '100%', width: `${score}%`, transition: 'width 0.5s ease' }}></div>
                                </div>
                                <p style={{ fontSize: 13, color: verdict.color, lineHeight: 1.5 }}>{verdict.text}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3' }}>
                    <h3>💰 Repair Cost Estimator</h3>
                    <p className="tool-desc">Select the diagnosed fault to get parts cost, labor estimate, suggested customer price, and repair difficulty rating.</p>
                    <div className="calculator-ui">
                      <select className="calc-input" title="Select repair type" value={costFault} onChange={e => { setCostFault(e.target.value); setCostResult(null); }} style={{ cursor: 'pointer' }}>
                        <option value="">-- Select Repair Type --</option>
                        <optgroup label="📱 Phone Repairs">
                          <option value="tristar">Tristar / Hydra IC Replacement</option>
                          <option value="audio-ic">Audio IC Replacement (Loop Disease)</option>
                          <option value="backlight-filter">Backlight Filter Replacement</option>
                          <option value="nand-reball">NAND Reball / Data Recovery</option>
                          <option value="baseband-ic">Baseband IC Replacement</option>
                          <option value="charge-port">Charge Port Replacement</option>
                          <option value="battery-replace">Battery Replacement</option>
                          <option value="screen-replace">Screen Replacement</option>
                          <option value="pmic-replace">PMIC Replacement</option>
                        </optgroup>
                        <optgroup label="💻 Laptop Repairs">
                          <option value="vrm-mosfet">VRM MOSFET Replacement</option>
                          <option value="bga-reball">BGA Reball (CPU/GPU)</option>
                          <option value="vapor-chamber-repaste">Vapor Chamber Repaste + Thermal Pads</option>
                          <option value="trace-rebuild">PCB Trace Rebuild</option>
                          <option value="ec-reflash">EC Firmware Reflash</option>
                          <option value="capacitor-replace">Capacitor Replacement</option>
                          <option value="usb-c-controller">USB-C PD Controller Replacement</option>
                          <option value="liquid-damage-clean">Liquid Damage Cleanup</option>
                          <option value="mux-switch">MUX Switch IC Replacement</option>
                        </optgroup>
                      </select>
                      <button className="calc-btn" onClick={runCostEstimate}>Calculate Cost</button>
                      {costResult && (
                        <div className="calc-result pass" style={{ textAlign: 'left' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
                            <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Parts Cost</div>
                              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)' }}>{costResult.parts}</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Labor Cost</div>
                              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-orange)' }}>{costResult.labor}</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Your Cost</div>
                              <div style={{ fontSize: 20, fontWeight: 700 }}>{costResult.total}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(57,211,83,0.1)', borderRadius: 10, border: '1px solid rgba(57,211,83,0.3)' }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Suggested Customer Price (2.5x)</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)' }}>{costResult.margin}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Difficulty / Time</div>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{costResult.difficulty} • {costResult.time}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3' }}>
                    <h3>🔎 Component Cross-Reference <span className="pro-badge-small" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff', fontSize: 9, marginLeft: 6 }}>ELITE</span></h3>
                    <p className="tool-desc">Search for any chip or component to see which boards use it, compatible alternatives, and repair notes.</p>
                    <div className="calculator-ui">
                      <input type="text" className="calc-input" placeholder="Search chip (e.g. CD3217, ISL6259, RTX3060M, IT8987E...)" value={xrefSearch} onChange={e => setXrefSearch(e.target.value.toUpperCase())} />
                    </div>
                    <div style={{ marginTop: 15 }}>
                      {Object.entries(XREF_DATABASE)
                        .filter(([key, val]) => xrefSearch.length >= 2 && (key.toUpperCase().includes(xrefSearch) || val.chip.toUpperCase().includes(xrefSearch)))
                        .map(([key, data]) => (
                          <div key={key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <strong style={{ fontSize: 15, color: 'var(--accent-cyan)' }}>{key}</strong>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{data.chip}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                              {data.boards.map((b, i) => (
                                <span key={i} style={{ background: 'rgba(0,122,255,0.15)', color: 'var(--accent-blue)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{b}</span>
                              ))}
                            </div>
                            <div style={{ fontSize: 12, marginBottom: 8 }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Alternatives: </span>
                              <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{data.alternatives.join(', ')}</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>{data.notes}</p>
                          </div>
                        ))
                      }
                      {xrefSearch.length >= 2 && Object.entries(XREF_DATABASE).filter(([key, val]) => key.toUpperCase().includes(xrefSearch) || val.chip.toUpperCase().includes(xrefSearch)).length === 0 && (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>No matching components found for "{xrefSearch}"</div>
                      )}
                    </div>
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3' }}>
                    <h3>📋 Repair Job Tracker</h3>
                    <p className="tool-desc">Track active repair jobs with status workflow. Data persists in your browser's local storage.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                      <input type="text" className="calc-input" placeholder="Device (e.g. Razer Blade 16)" value={newJob.device} onChange={e => setNewJob({ ...newJob, device: e.target.value })} style={{ margin: 0 }} />
                      <input type="text" className="calc-input" placeholder="Customer Name" value={newJob.customer} onChange={e => setNewJob({ ...newJob, customer: e.target.value })} style={{ margin: 0 }} />
                      <input type="text" className="calc-input" placeholder="Fault Description" value={newJob.fault} onChange={e => setNewJob({ ...newJob, fault: e.target.value })} style={{ margin: 0 }} />
                      <button className="calc-btn" onClick={saveRepairJob} style={{ margin: 0, height: 42 }}>+ Add Job</button>
                    </div>
                    {repairJobs.length > 0 && (
                      <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {repairJobs.map(job => {
                          const statusColors: Record<string, string> = {
                            'intake': '#6e7681', 'diagnosing': 'var(--accent-blue)', 'parts-ordered': 'var(--accent-orange)',
                            'repairing': 'var(--accent-cyan)', 'testing': '#d29922', 'complete': 'var(--accent-green)'
                          };
                          const statusEmojis: Record<string, string> = {
                            'intake': '📥', 'diagnosing': '🔍', 'parts-ordered': '📦',
                            'repairing': '🔧', 'testing': '🧪', 'complete': '✅'
                          };
                          return (
                            <div key={job.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', border: `1px solid ${statusColors[job.status]}30`, display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 20 }}>{statusEmojis[job.status]}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{job.device} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>— {job.customer}</span></div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{job.fault} • {job.date}</div>
                              </div>
                              <select
                                title="Update job status"
                                value={job.status}
                                onChange={e => updateJobStatus(job.id, e.target.value as RepairJob['status'])}
                                style={{ background: statusColors[job.status], color: '#fff', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                <option value="intake">📥 Intake</option>
                                <option value="diagnosing">🔍 Diagnosing</option>
                                <option value="parts-ordered">📦 Parts Ordered</option>
                                <option value="repairing">🔧 Repairing</option>
                                <option value="testing">🧪 Testing</option>
                                <option value="complete">✅ Complete</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3', border: isEliteUser ? '1px solid rgba(245,175,25,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <h3>⚠️ Known Design Flaws Database <span className="pro-badge-small" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff', fontSize: 9, marginLeft: 6 }}>ELITE</span></h3>
                    <p className="tool-desc">Documented manufacturer defects and design flaws—know what you're dealing with before you start probing.</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 15, flexWrap: 'wrap' }}>
                      {['all', 'Razer', 'ASUS', 'Lenovo', 'Apple'].map(brand => (
                        <button key={brand} onClick={() => setFlawFilter(brand)} style={{
                          padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: flawFilter === brand ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)',
                          color: flawFilter === brand ? '#000' : 'var(--text-secondary)', transition: 'all 0.2s'
                        }}>{brand === 'all' ? 'All Brands' : brand}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {DESIGN_FLAWS
                        .filter(f => flawFilter === 'all' || f.brand === flawFilter)
                        .map(flaw => (
                          <div key={flaw.id} style={{
                            background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px',
                            border: `1px solid ${flaw.severity === 'critical' ? 'rgba(248,81,73,0.3)' : flaw.severity === 'high' ? 'rgba(240,136,62,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                  background: flaw.severity === 'critical' ? 'rgba(248,81,73,0.2)' : flaw.severity === 'high' ? 'rgba(240,136,62,0.2)' : flaw.severity === 'medium' ? 'rgba(210,153,34,0.2)' : 'rgba(255,255,255,0.08)',
                                  color: flaw.severity === 'critical' ? '#f85149' : flaw.severity === 'high' ? '#f0883e' : flaw.severity === 'medium' ? '#d29922' : 'var(--text-secondary)'
                                }}>{flaw.severity.toUpperCase()}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{flaw.brand} • {flaw.model}</span>
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Discovered {flaw.discovered}</span>
                            </div>
                            <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>{flaw.title}</strong>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{flaw.description}</p>
                            <div style={{ fontSize: 12, padding: '8px 12px', background: 'rgba(57,211,83,0.08)', borderRadius: 8, borderLeft: '3px solid var(--accent-green)' }}>
                              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Fix: </span>{flaw.fix}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3', border: isEliteUser ? '1px solid rgba(245,175,25,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <h3>🔌 Visual Power Tree <span className="pro-badge-small" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff', fontSize: 9, marginLeft: 6 }}>ELITE</span></h3>
                    <p className="tool-desc">Interactive voltage rail dependency diagram. Follow the power flow from charger input to CPU/GPU cores.</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 15 }}>
                      {Object.entries(POWER_TREES).map(([key, tree]) => (
                        <button key={key} onClick={() => setSelectedTree(key)} style={{
                          padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: selectedTree === key ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
                          color: selectedTree === key ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s'
                        }}>{tree.name}</button>
                      ))}
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 20, overflow: 'auto' }}>
                      <svg width="100%" viewBox="0 0 600 320" style={{ minWidth: 500 }}>
                        {(() => {
                          const tree = POWER_TREES[selectedTree];
                          const roots = tree.nodes.filter(n => !n.parent);
                          const getChildren = (parentId: string) => tree.nodes.filter(n => n.parent === parentId);
                          const positions: Record<string, { x: number, y: number }> = {};
                          // Layout: root at top, children spread below
                          roots.forEach((r) => { positions[r.id] = { x: 300, y: 20 }; });
                          const level1 = tree.nodes.filter(n => n.parent && roots.some(r => r.id === n.parent));
                          level1.forEach((n, i) => { positions[n.id] = { x: 50 + (i * (500 / Math.max(level1.length - 1, 1))), y: 120 }; });
                          const level2 = tree.nodes.filter(n => n.parent && level1.some(l => l.id === n.parent));
                          level2.forEach((n) => {
                            const parent = positions[n.parent!];
                            const siblings = getChildren(n.parent!);
                            const sibIdx = siblings.indexOf(n);
                            positions[n.id] = { x: (parent?.x || 200) + (sibIdx - (siblings.length - 1) / 2) * 100, y: 230 };
                          });
                          return (
                            <>
                              {tree.nodes.filter(n => n.parent && positions[n.id] && positions[n.parent!]).map(n => (
                                <line key={`line-${n.id}`} x1={positions[n.parent!].x} y1={positions[n.parent!].y + 22} x2={positions[n.id].x} y2={positions[n.id].y - 8} stroke={n.color} strokeWidth={2} opacity={0.4} />
                              ))}
                              {tree.nodes.filter(n => positions[n.id]).map(n => {
                                const pos = positions[n.id];
                                return (
                                  <g key={n.id}>
                                    <rect x={pos.x - 52} y={pos.y - 8} width={104} height={50} rx={8} fill={`${n.color}20`} stroke={n.color} strokeWidth={1.5} />
                                    <text x={pos.x} y={pos.y + 10} textAnchor="middle" fill={n.color} fontSize={10} fontWeight={700}>{n.label}</text>
                                    <text x={pos.x} y={pos.y + 28} textAnchor="middle" fill="#aaa" fontSize={9}>{n.voltage}</text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>

                  <div className="tool-card" style={{ gridColumn: 'span 3', border: isEliteUser ? '1px solid rgba(245,175,25,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <h3>📊 Repair Analytics Dashboard <span className="pro-badge-small" style={{ background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff', fontSize: 9, marginLeft: 6 }}>ELITE</span></h3>
                    <p className="tool-desc">Live stats from your Repair Job Tracker. Add more jobs to see your data here.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginTop: 15 }}>
                      <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-blue)' }}>{repairAnalytics.total}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Total Jobs</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{repairAnalytics.completed}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Completed</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-cyan)' }}>{repairAnalytics.inProgress}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>In Progress</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-orange)' }}>{repairAnalytics.intake}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Intake Queue</div>
                      </div>
                    </div>
                    {repairAnalytics.topDevices.length > 0 && (
                      <div style={{ marginTop: 15 }}>
                        <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Top Devices</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {repairAnalytics.topDevices.map(([device, count]) => (
                            <div key={device} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, width: 80 }}>{device}</span>
                              <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                                <div style={{ background: 'var(--accent-cyan)', height: '100%', width: `${(count / repairAnalytics.total) * 100}%`, borderRadius: 4, transition: 'width 0.5s ease' }}></div>
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 30, textAlign: 'right' }}>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* License Activation Modal */}
      {isCheckoutOpen && (
        <div className="stripe-modal-overlay">
          <div className="stripe-modal-content" style={{ maxWidth: 450 }}>
            <button className="stripe-close" onClick={() => setIsCheckoutOpen(false)}>×</button>
            <div className="stripe-header" style={{ padding: '30px 30px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 15 }}>🔑</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px 0' }}>Activate {checkoutTier === 'pro' ? 'PRO' : 'ELITE'}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                BoardX is distributed as a premium desktop application. To unlock these features, please purchase a license key or enter your existing key below.
              </p>
            </div>

            <div className="stripe-body" style={{ padding: '0 30px 30px' }}>
              <a
                href={checkoutTier === 'pro' ? 'https://gum.co/kscsBqfpu9-7jE0qVD7bcA==' : 'https://gum.co/your_elite_permalink_here'}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', width: '100%', padding: 14, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, textAlign: 'center',
                  color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, marginBottom: 25,
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                🛒 Purchase License Key Online
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>OR ENTER EXISTING KEY</div>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="license-key-input"
                  placeholder={`e.g. ${checkoutTier === 'pro' ? 'PRO' : 'ELITE'}-ABCD-1234-WXYZ`}
                  style={{
                    width: '100%', padding: 14, background: '#000', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'monospace', textAlign: 'center',
                    letterSpacing: 2
                  }}
                />
              </div>

              <button
                className="stripe-pay-btn"
                style={{ marginTop: 20 }}
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerText;
                  btn.innerText = 'Verifying with Gumroad...';
                  btn.disabled = true;

                  const input = document.getElementById('license-key-input') as HTMLInputElement;
                  const key = input?.value.trim() || '';

                  try {
                    // 🚨 GUMROAD INTEGRATION SETUP 🚨
                    // Replace 'your_pro_permalink' and 'your_elite_permalink' with the 
                    // actual product URL ending you create on Gumroad (e.g., if your link is 
                    // gumroad.com/l/boardx-pro, the permalink is 'boardx-pro')
                    const productPermalink = checkoutTier === 'pro'
                      ? 'kscsBqfpu9-7jE0qVD7bcA=='
                      : 'your_elite_permalink_here';

                    // For rapid testing right now: we keep the prefix check alive. 
                    // REMOVE THIS IF-STATEMENT BEFORE LAUNCH AND ONLY USE THE GUMROAD FETCH!
                    if (key.startsWith(checkoutTier.toUpperCase())) {
                      setIsCheckoutOpen(false);
                      setUserTier(checkoutTier);
                      localStorage.setItem('boardx_user_tier', checkoutTier);
                      alert(`✅ (Test Mode) License Validated!\n\nWelcome to BoardX ${checkoutTier.toUpperCase()}!`);
                      return;
                    }

                    // --- REAL GUMROAD API VERIFICATION ---
                    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        product_permalink: productPermalink,
                        license_key: key
                      })
                    });

                    const data = await response.json();

                    if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
                      setIsCheckoutOpen(false);
                      setUserTier(checkoutTier);
                      localStorage.setItem('boardx_user_tier', checkoutTier);
                      alert(`✅ License Formally Validated!\n\nWelcome to BoardX ${checkoutTier.toUpperCase()}!`);
                    } else {
                      alert('❌ Invalid or Refunded License Key. Please try again.');
                    }
                  } catch (error) {
                    console.error("Gumroad API Error:", error);
                    alert('❌ Connection Error. Unable to reach Gumroad authentication servers. Please check your internet.');
                  } finally {
                    btn.innerText = originalText;
                    btn.disabled = false;
                  }
                }}
              >
                Activate License
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Page Tab */}
      {activeTab === 'pricing' && (
        <div className="stripe-modal-overlay" style={{ position: 'fixed', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 1000, width: '95%', padding: 40, background: 'var(--bg-secondary)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflow: 'auto' }}>
            <button className="stripe-close" onClick={() => setActiveTab('diagnostics')} style={{ position: 'absolute', top: 15, right: 20 }}>×</button>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BoardX PRO Plans</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>Choose the plan that fits your repair shop</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30, paddingBottom: 40 }}>
              {/* FREE TIER */}
              <div className="glass-panel" style={{ borderRadius: 24, padding: 32, border: userTier === 'free' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {userTier === 'free' && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-cyan)', color: '#000', padding: '4px 20px', borderRadius: 24, fontSize: 12, fontWeight: 800 }}>ACTIVE PLAN</div>}
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <div style={{ fontSize: 32, marginBottom: 15 }}>👨‍🔧</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px 0' }}>Trainee</h3>
                  <div style={{ fontSize: 36, fontWeight: 900 }}>$0<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-secondary)' }}> Lifetime</span></div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 }}>Essential for beginners</p>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
                  {['✅ 5 basic test points', '✅ All 6 device models (partial)', '✅ Global search enabled', '✅ Community Q&A (read-only)', '✅ Smart Diode Calculator', '❌ PRO test points (33 locked)', '❌ All advanced Smart Tools', '❌ Schematic Viewer mapping', '❌ Design Flaws DB', '❌ Priority Support'].map((f, i) => (
                    <div key={i} style={{ fontSize: 13, color: f.startsWith('❌') ? 'rgba(255,255,255,0.3)' : 'var(--text-primary)', display: 'flex', gap: 8 }}>
                      <span style={{ opacity: f.startsWith('❌') ? 0.4 : 1 }}>{f.substring(0, 1)}</span> <span>{f.substring(2)}</span>
                    </div>
                  ))}
                </div>
                <button className="calc-btn" disabled style={{ width: '100%', padding: '14px', borderRadius: 12, opacity: 0.5, cursor: 'default' }}>Locked</button>
              </div>

              {/* PRO TIER */}
              <div className="glass-panel" style={{ borderRadius: 24, padding: 32, border: userTier === 'pro' ? '2px solid var(--accent-blue)' : '2px solid var(--accent-blue)', position: 'relative', display: 'flex', flexDirection: 'column', transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(0,122,255,0.2)', backgroundColor: 'rgba(0,122,255,0.05)' }}>
                {userTier === 'pro' ? <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-blue)', color: '#fff', padding: '4px 20px', borderRadius: 24, fontSize: 12, fontWeight: 800 }}>ACTIVE PLAN</div> : <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '4px 20px', borderRadius: 24, fontSize: 12, fontWeight: 800 }}>RECOMMENDED</div>}
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <div style={{ fontSize: 32, marginBottom: 15 }}>⚡</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px 0' }}>Master</h3>
                  <div style={{ fontSize: 36, fontWeight: 900 }}>$29.99<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-secondary)' }}> Lifetime</span></div>
                  <p style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 700, marginTop: 10 }}>For professional repair shops</p>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
                  {['✅ Everything in Trainee, plus:', '✅ All 38 test points unlocked', '✅ Full Schematic Viewer access', '✅ Symptom Diagnostic Wizard', '✅ Repair Job Tracker (local)', '✅ Repair Cost Estimator', '✅ Community Q&A (full access)', '❌ Design Flaws Database', '❌ Visual Power Trees', '❌ Priority Support'].map((f, i) => (
                    <div key={i} style={{ fontSize: 13, color: f.startsWith('❌') ? 'rgba(255,255,255,0.3)' : 'var(--text-primary)', display: 'flex', gap: 8, fontWeight: i === 0 ? 800 : 400 }}>
                      <span style={{ opacity: f.startsWith('❌') ? 0.4 : 1 }}>{f.substring(0, 1)}</span> <span>{f.substring(2)}</span>
                    </div>
                  ))}
                </div>
                {userTier === 'pro' ? (
                  <button className="calc-btn" disabled style={{ width: '100%', padding: '14px', borderRadius: 12, opacity: 0.5, cursor: 'default' }}>Current Plan</button>
                ) : userTier === 'elite' ? (
                  <button className="calc-btn" disabled style={{ width: '100%', padding: '14px', borderRadius: 12, opacity: 0.5 }}>Included in Elite</button>
                ) : (
                  <button className="stripe-pay-btn" style={{ width: '100%', padding: '14px', borderRadius: 12 }} onClick={() => openCheckout('pro')}>Upgrade to Pro</button>
                )}
              </div>

              {/* ELITE TIER */}
              <div className="glass-panel" style={{ borderRadius: 24, padding: 32, border: userTier === 'elite' ? '2px solid #f5af19' : '1px solid rgba(245,175,25,0.3)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {userTier === 'elite' && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f5af19, #f12711)', color: '#fff', padding: '4px 20px', borderRadius: 24, fontSize: 12, fontWeight: 800 }}>ACTIVE PLAN</div>}
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <div style={{ fontSize: 32, marginBottom: 15 }}>👑</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px 0', background: 'linear-gradient(135deg, #f5af19, #f12711)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Elite</h3>
                  <div style={{ fontSize: 36, fontWeight: 900 }}>$49.99<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-secondary)' }}> Lifetime</span></div>
                  <p style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 800 }}>30-DAY REFUND POLICY</p>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
                  {['✅ Everything in Master, plus:', '✅ Design Flaws Database (12+)', '✅ Visual Power Tree Diagrams', '✅ MacBook Power Sequence Tracer', '✅ Liquid Damage Assessment Tool', '✅ Component Cross-Reference', '✅ Repair Analytics Dashboard', '✅ Priority 24/7 Expert Support', '✅ Export PDF Repair Reports'].map((f, i) => (
                    <div key={i} style={{ fontSize: 13, fontWeight: i === 0 ? 800 : 400, display: 'flex', gap: 8 }}>
                      <span>{f.substring(0, 1)}</span> <span>{f.substring(2)}</span>
                    </div>
                  ))}
                </div>
                {userTier === 'elite' ? (
                  <button className="calc-btn" disabled style={{ width: '100%', padding: '14px', borderRadius: 12, opacity: 0.5, cursor: 'default' }}>Current Plan</button>
                ) : (
                  <button className="stripe-pay-btn" style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #f5af19, #f12711)' }} onClick={() => openCheckout('elite')}>Get Elite Access</button>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 30, color: 'var(--text-secondary)', fontSize: 12 }}>
              <p>All plans grant lifetime offline access. No recurring subscriptions.</p>
              <p style={{ marginTop: 6 }}>🔒 Secure payments processed by Gumroad.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
