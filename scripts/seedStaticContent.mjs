#!/usr/bin/env node
/**
 * Static Content Seeder — Pre-written infographics + slides for ALL topics
 * across JEE, NEET and CUET. No Gemini API needed.
 *
 * Uses Firebase Admin SDK (service account) to bypass security rules.
 * Writes to Firestore collection: `studyContent`
 * Usage: node scripts/seedStaticContent.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const admin = require('firebase-admin');
const path = require('path');
const os = require('os');

// Service account path
const serviceAccountPath = path.join(os.homedir(), 'Downloads', 'jee-dsb-challenge-firebase-adminsdk-fbsvc-670c4d011f.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function docId(mode, exam, subject, topic) {
  return `${mode}_${exam}_${subject}_${topic}`.replace(/[\/\s]+/g, '_');
}

// ════════════════════════════════════════════════════════════════
//  JEE INFOGRAPHICS
// ════════════════════════════════════════════════════════════════

const JEE_INFOGRAPHICS = {
  Physics: {
    Mechanics: {
      title: "Mechanics — Complete JEE Summary",
      sections: [
        { heading: "Newton's Laws of Motion", points: ["First Law: A body remains at rest or in uniform motion unless acted upon by an external force", "Second Law: $F = ma$ — force equals mass times acceleration", "Third Law: Every action has an equal and opposite reaction", "Free body diagrams are essential for solving force problems"], keyFormula: "$\\vec{F}_{net} = m\\vec{a}$" },
        { heading: "Work, Energy & Power", points: ["Work done: $W = \\vec{F} \\cdot \\vec{d} = Fd\\cos\\theta$", "Kinetic Energy: $KE = \\frac{1}{2}mv^2$", "Potential Energy: $PE = mgh$ (gravitational)", "Work-Energy Theorem: Net work = Change in KE", "Power: $P = \\frac{dW}{dt} = \\vec{F} \\cdot \\vec{v}$"], keyFormula: "$W_{net} = \\Delta KE = \\frac{1}{2}mv^2 - \\frac{1}{2}mu^2$" },
        { heading: "Rotational Mechanics", points: ["Moment of inertia: $I = \\sum m_i r_i^2$", "Torque: $\\tau = r \\times F = I\\alpha$", "Angular momentum: $L = I\\omega$", "Parallel axis theorem: $I = I_{cm} + Md^2$", "Rolling without slipping: $v = R\\omega$"], keyFormula: "$\\tau = I\\alpha, \\quad L = I\\omega$" },
        { heading: "Gravitation", points: ["Newton's law: $F = \\frac{Gm_1m_2}{r^2}$", "Gravitational PE: $U = -\\frac{Gm_1m_2}{r}$", "Orbital velocity: $v_o = \\sqrt{\\frac{GM}{r}}$", "Escape velocity: $v_e = \\sqrt{\\frac{2GM}{R}}$", "Kepler's Third Law: $T^2 \\propto a^3$"], keyFormula: "$v_e = \\sqrt{2gR} \\approx 11.2 \\text{ km/s}$" },
        { heading: "Simple Harmonic Motion", points: ["Equation: $x = A\\sin(\\omega t + \\phi)$", "Time period of spring: $T = 2\\pi\\sqrt{\\frac{m}{k}}$", "Time period of pendulum: $T = 2\\pi\\sqrt{\\frac{l}{g}}$", "Total energy: $E = \\frac{1}{2}kA^2$ (constant)"], keyFormula: "$a = -\\omega^2 x$" }
      ]
    },
    Electrodynamics: {
      title: "Electrodynamics — Complete JEE Summary",
      sections: [
        { heading: "Coulomb's Law & Electric Field", points: ["$F = \\frac{1}{4\\pi\\epsilon_0}\\frac{q_1 q_2}{r^2}$", "Electric field: $E = \\frac{F}{q_0} = \\frac{kQ}{r^2}$", "Superposition principle applies to both force and field", "Field lines: away from +ve, toward -ve charges"], keyFormula: "$k = \\frac{1}{4\\pi\\epsilon_0} = 9 \\times 10^9 \\text{ Nm}^2/\\text{C}^2$" },
        { heading: "Gauss's Law & Applications", points: ["$\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{enc}}{\\epsilon_0}$", "Infinite plane: $E = \\frac{\\sigma}{2\\epsilon_0}$", "Conducting sphere: $E = \\frac{kQ}{r^2}$ outside, 0 inside", "Use symmetry: spherical, cylindrical, planar"], keyFormula: "$\\Phi_E = \\frac{Q_{enclosed}}{\\epsilon_0}$" },
        { heading: "Capacitance", points: ["Parallel plate: $C = \\frac{\\epsilon_0 A}{d}$", "With dielectric: $C = \\frac{K\\epsilon_0 A}{d}$", "Series: $\\frac{1}{C_{eq}} = \\sum \\frac{1}{C_i}$", "Parallel: $C_{eq} = \\sum C_i$", "Energy stored: $U = \\frac{1}{2}CV^2 = \\frac{Q^2}{2C}$"], keyFormula: "$U = \\frac{1}{2}CV^2$" },
        { heading: "Current Electricity", points: ["Ohm's Law: $V = IR$", "Kirchhoff's Junction Rule: $\\sum I_{in} = \\sum I_{out}$", "Kirchhoff's Loop Rule: $\\sum V = 0$ around any loop", "Wheatstone Bridge: $\\frac{P}{Q} = \\frac{R}{S}$ for balance", "Power: $P = VI = I^2R = \\frac{V^2}{R}$"], keyFormula: "$R = \\rho\\frac{l}{A}$" },
        { heading: "Electromagnetic Induction", points: ["Faraday's Law: $\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$", "Lenz's Law: Induced current opposes change in flux", "Self-inductance: $\\mathcal{E} = -L\\frac{dI}{dt}$", "Energy in inductor: $U = \\frac{1}{2}LI^2$", "Mutual inductance: $\\mathcal{E}_2 = -M\\frac{dI_1}{dt}$"], keyFormula: "$\\mathcal{E} = -N\\frac{d\\Phi_B}{dt}$" }
      ]
    },
    Optics: {
      title: "Optics — Complete JEE Summary",
      sections: [
        { heading: "Reflection & Mirrors", points: ["Angle of incidence = Angle of reflection", "Mirror formula: $\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f}$", "Magnification: $m = -\\frac{v}{u}$", "Concave mirror: converging, Convex mirror: diverging", "Real images: $v$ is negative (in front of mirror)"], keyFormula: "$\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f}$" },
        { heading: "Refraction & Lenses", points: ["Snell's Law: $n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$", "Lens formula: $\\frac{1}{v} - \\frac{1}{u} = \\frac{1}{f}$", "Lensmaker's equation: $\\frac{1}{f} = (\\mu-1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)$", "Total internal reflection when $\\theta > \\theta_c$", "Critical angle: $\\sin\\theta_c = \\frac{n_2}{n_1}$"], keyFormula: "$n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$" },
        { heading: "Wave Optics", points: ["Young's double slit: $y_n = \\frac{n\\lambda D}{d}$", "Fringe width: $\\beta = \\frac{\\lambda D}{d}$", "Single slit diffraction: first minimum at $a\\sin\\theta = \\lambda$", "Constructive interference: path difference = $n\\lambda$", "Destructive: path difference = $(n+\\frac{1}{2})\\lambda$"], keyFormula: "$\\beta = \\frac{\\lambda D}{d}$" },
        { heading: "Optical Instruments", points: ["Simple microscope magnification: $m = 1 + \\frac{D}{f}$", "Compound microscope: $m = m_o \\times m_e$", "Telescope magnification: $m = \\frac{f_o}{f_e}$", "Resolving power depends on aperture diameter", "Human eye: least distance of distinct vision = 25 cm"], keyFormula: "$m_{telescope} = -\\frac{f_o}{f_e}$" }
      ]
    },
    Thermodynamics: {
      title: "Thermodynamics — Complete JEE Summary",
      sections: [
        { heading: "Laws of Thermodynamics", points: ["Zeroth Law: Thermal equilibrium is transitive", "First Law: $\\Delta U = Q - W$ (energy conservation)", "Second Law: Entropy of isolated system never decreases", "Third Law: Entropy approaches zero as $T \\to 0$"], keyFormula: "$\\Delta U = Q - W$" },
        { heading: "Thermodynamic Processes", points: ["Isothermal ($T$ = const): $W = nRT\\ln\\frac{V_2}{V_1}$", "Adiabatic ($Q$ = 0): $PV^\\gamma = \\text{const}$", "Isobaric ($P$ = const): $W = P\\Delta V$", "Isochoric ($V$ = const): $W = 0$, $Q = nC_v\\Delta T$"], keyFormula: "$PV^\\gamma = \\text{constant (adiabatic)}$" },
        { heading: "Kinetic Theory of Gases", points: ["Ideal gas: $PV = nRT$", "Average KE per molecule: $\\frac{3}{2}k_BT$", "RMS speed: $v_{rms} = \\sqrt{\\frac{3RT}{M}}$", "Degrees of freedom: monoatomic=3, diatomic=5", "Equipartition: $\\frac{1}{2}k_BT$ per degree of freedom"], keyFormula: "$v_{rms} = \\sqrt{\\frac{3k_BT}{m}}$" },
        { heading: "Heat Engines & Carnot Cycle", points: ["Efficiency: $\\eta = 1 - \\frac{Q_2}{Q_1}$", "Carnot efficiency: $\\eta_C = 1 - \\frac{T_2}{T_1}$ (maximum possible)", "Refrigerator COP: $\\beta = \\frac{Q_2}{W} = \\frac{T_2}{T_1 - T_2}$", "No real engine can exceed Carnot efficiency"], keyFormula: "$\\eta_{Carnot} = 1 - \\frac{T_{cold}}{T_{hot}}$" }
      ]
    },
    "Modern Physics": {
      title: "Modern Physics — Complete JEE Summary",
      sections: [
        { heading: "Photoelectric Effect", points: ["$E = h\\nu = \\frac{hc}{\\lambda}$", "Einstein's equation: $KE_{max} = h\\nu - \\phi$", "Threshold frequency: $\\nu_0 = \\frac{\\phi}{h}$", "Stopping potential: $eV_0 = h\\nu - \\phi$", "Photocurrent proportional to intensity"], keyFormula: "$KE_{max} = h\\nu - \\phi$" },
        { heading: "Bohr's Atomic Model", points: ["Angular momentum quantized: $L = n\\frac{h}{2\\pi}$", "Energy levels: $E_n = -\\frac{13.6}{n^2}$ eV (for hydrogen)", "Radius: $r_n = 0.529 n^2$ Å", "Transition energy: $\\Delta E = 13.6\\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)$ eV", "Spectral series: Lyman (UV), Balmer (visible), Paschen (IR)"], keyFormula: "$E_n = -\\frac{13.6Z^2}{n^2} \\text{ eV}$" },
        { heading: "Nuclear Physics", points: ["Mass defect: $\\Delta m = Zm_p + Nm_n - M_{nucleus}$", "Binding energy: $BE = \\Delta m \\times 931.5$ MeV", "Alpha decay: $Z \\to Z-2$, $A \\to A-4$", "Beta decay: neutron → proton + electron + antineutrino", "Half-life: $N = N_0 \\left(\\frac{1}{2}\\right)^{t/T_{1/2}}$"], keyFormula: "$N = N_0 e^{-\\lambda t}, \\quad T_{1/2} = \\frac{0.693}{\\lambda}$" },
        { heading: "Dual Nature & de Broglie", points: ["de Broglie wavelength: $\\lambda = \\frac{h}{mv} = \\frac{h}{p}$", "For electron with voltage V: $\\lambda = \\frac{12.27}{\\sqrt{V}}$ Å", "Heisenberg uncertainty: $\\Delta x \\cdot \\Delta p \\geq \\frac{h}{4\\pi}$", "Matter waves confirmed by Davisson-Germer experiment"], keyFormula: "$\\lambda = \\frac{h}{mv}$" }
      ]
    },
    Waves: {
      title: "Waves — Complete JEE Summary",
      sections: [
        { heading: "Wave Basics", points: ["$v = f\\lambda = \\frac{\\omega}{k}$", "Transverse: displacement perpendicular to propagation", "Longitudinal: displacement along propagation direction", "Wave equation: $y = A\\sin(kx - \\omega t + \\phi)$", "Speed on string: $v = \\sqrt{\\frac{T}{\\mu}}$"], keyFormula: "$v = f\\lambda$" },
        { heading: "Superposition & Interference", points: ["Constructive: path difference = $n\\lambda$", "Destructive: path difference = $(2n+1)\\frac{\\lambda}{2}$", "Beats: $f_{beat} = |f_1 - f_2|$", "Standing waves: nodes (zero displacement), antinodes (max)"], keyFormula: "$f_{beat} = |f_1 - f_2|$" },
        { heading: "Standing Waves & Harmonics", points: ["String fixed at both ends: $f_n = \\frac{n}{2L}\\sqrt{\\frac{T}{\\mu}}$", "Open pipe: $f_n = \\frac{nv}{2L}$ (all harmonics)", "Closed pipe: $f_n = \\frac{nv}{4L}$ (odd harmonics only)", "Resonance occurs when driving frequency matches natural frequency"], keyFormula: "$f_n = \\frac{nv}{2L} \\text{ (open pipe)}$" },
        { heading: "Doppler Effect", points: ["General formula: $f' = f\\frac{v \\pm v_o}{v \\mp v_s}$", "Source approaching: frequency increases", "Source receding: frequency decreases", "Observer approaching: frequency increases", "Both moving: use appropriate signs carefully"], keyFormula: "$f' = f\\left(\\frac{v + v_o}{v - v_s}\\right)$" }
      ]
    }
  },
  Chemistry: {
    "Organic Chemistry": {
      title: "Organic Chemistry — Complete JEE Summary",
      sections: [
        { heading: "IUPAC Nomenclature & Isomerism", points: ["Longest chain → root name, substituents as prefixes", "Chain isomerism, position isomerism, functional group isomerism", "Geometrical (cis-trans/E-Z) around C=C or ring", "Optical isomerism: chiral center with 4 different groups", "R/S configuration using Cahn-Ingold-Prelog rules"] },
        { heading: "Reaction Mechanisms", points: ["SN1: Carbocation intermediate, racemization, favored by 3° substrate", "SN2: Backside attack, inversion, favored by 1° substrate + strong nucleophile", "E1: Unimolecular elimination, Zaitsev's rule", "E2: Bimolecular elimination, anti-periplanar geometry required", "Free radical: Initiation → Propagation → Termination"] },
        { heading: "Named Reactions for JEE", points: ["Aldol condensation: base-catalyzed, forms β-hydroxy carbonyl", "Cannizzaro: HCHO with strong base → disproportionation", "Friedel-Crafts: alkylation/acylation with AlCl₃ catalyst", "Grignard: RMgX + carbonyl → alcohol", "Hofmann bromamide: amide → primary amine (1 less carbon)"] },
        { heading: "GOC — General Organic Chemistry", points: ["Inductive effect: electron-withdrawing (-I) or donating (+I)", "Resonance: delocalization of π electrons or lone pairs", "Hyperconjugation: σ-bond electrons delocalize into vacant p-orbital", "Stability order of carbocations: 3° > 2° > 1° > methyl", "Acidity: electron-withdrawing groups increase acidity"] }
      ]
    },
    "Inorganic Chemistry": {
      title: "Inorganic Chemistry — Complete JEE Summary",
      sections: [
        { heading: "Periodic Table Trends", points: ["Atomic radius decreases across period, increases down group", "Ionization energy increases across period, decreases down group", "Electronegativity: F > O > Cl > N (Pauling scale)", "Metallic character increases down group, decreases across period", "Electron affinity: halogens have highest (except F < Cl)"] },
        { heading: "p-Block Elements", points: ["Group 15: N₂ is inert (triple bond), P forms P₄", "Group 16: O₂ is paramagnetic, S shows allotropy (S₈)", "Group 17: Halogens — strongest oxidizing agents", "Group 18: Noble gases — filled octets, low reactivity", "Oxyacids of P: H₃PO₄ (tribasic), H₃PO₃ (dibasic)"] },
        { heading: "d-Block & Coordination Chemistry", points: ["Variable oxidation states due to close (n-1)d and ns energies", "Colored compounds: d-d transitions", "Crystal Field Theory: splitting of d-orbitals in ligand field", "Octahedral: $\\Delta_o$ splitting, t₂g and eg levels", "Spectrochemical series: I⁻ < Br⁻ < Cl⁻ < F⁻ < H₂O < NH₃ < en < CN⁻ < CO"] },
        { heading: "Chemical Bonding", points: ["Ionic: metal + nonmetal, lattice energy drives formation", "Covalent: sharing of electrons, VSEPR for geometry", "sp³ = tetrahedral, sp² = trigonal planar, sp = linear", "Molecular Orbital Theory: bonding & antibonding MOs", "Bond order = $\\frac{1}{2}(N_b - N_a)$"], keyFormula: "$\\text{Bond Order} = \\frac{N_b - N_a}{2}$" }
      ]
    },
    "Physical Chemistry": {
      title: "Physical Chemistry — Complete JEE Summary",
      sections: [
        { heading: "Chemical Kinetics", points: ["Rate law: $r = k[A]^m[B]^n$ (determined experimentally)", "First order: $t_{1/2} = \\frac{0.693}{k}$ (independent of concentration)", "Arrhenius equation: $k = Ae^{-E_a/RT}$", "Order ≠ molecularity (order is experimental, molecularity is theoretical)", "Integrated rate law (1st order): $\\ln[A] = \\ln[A]_0 - kt$"], keyFormula: "$k = Ae^{-E_a/RT}$" },
        { heading: "Equilibrium", points: ["$K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}$ at equilibrium", "Le Chatelier's principle: system opposes change", "Relation: $K_p = K_c(RT)^{\\Delta n_g}$", "Larger K → more products at equilibrium", "Catalyst doesn't change K, only speeds up reaching equilibrium"], keyFormula: "$K_p = K_c(RT)^{\\Delta n_g}$" },
        { heading: "Electrochemistry", points: ["$E^\\circ_{cell} = E^\\circ_{cathode} - E^\\circ_{anode}$", "Nernst equation: $E = E^\\circ - \\frac{RT}{nF}\\ln Q$", "At 25°C: $E = E^\\circ - \\frac{0.059}{n}\\log Q$", "$\\Delta G^\\circ = -nFE^\\circ_{cell}$", "Faraday's law: $m = \\frac{MIt}{nF}$"], keyFormula: "$E = E^\\circ - \\frac{0.059}{n}\\log Q$" },
        { heading: "Thermochemistry & Solutions", points: ["Hess's Law: enthalpy change is path-independent", "$\\Delta G = \\Delta H - T\\Delta S$ (spontaneous if $\\Delta G < 0$)", "Raoult's Law: $P_A = x_A P_A^\\circ$", "Colligative properties: depend on number of solute particles", "van 't Hoff factor $i$: accounts for dissociation/association"], keyFormula: "$\\Delta G = \\Delta H - T\\Delta S$" }
      ]
    },
    "Coordination Compounds": {
      title: "Coordination Compounds — Complete JEE Summary",
      sections: [
        { heading: "Werner's Theory & Terminology", points: ["Central metal atom/ion surrounded by ligands", "Coordination number = number of bonds to central atom", "Primary valence = oxidation state, secondary valence = coordination number", "Ligands: monodentate (1 bond), bidentate (2 bonds), polydentate"], },
        { heading: "Isomerism in Coordination Compounds", points: ["Geometrical isomerism: cis-trans in square planar and octahedral", "Optical isomerism: in octahedral complexes with bidentate ligands", "Ionization isomerism: exchange between inner and outer sphere", "Linkage isomerism: ligand bonds through different atoms (NO₂⁻ vs ONO⁻)", "Coordination isomerism: exchange of ligands between cation and anion"] },
        { heading: "Crystal Field Theory", points: ["Octahedral splitting: $\\Delta_o$ between t₂g (lower) and eg (upper)", "Tetrahedral splitting: $\\Delta_t ≈ \\frac{4}{9}\\Delta_o$", "Strong field ligands → large splitting → low spin", "Weak field ligands → small splitting → high spin", "CFSE = stabilization energy from d-electron arrangement"], keyFormula: "$\\Delta_t \\approx \\frac{4}{9}\\Delta_o$" },
        { heading: "Applications & Important Complexes", points: ["Hemoglobin: Fe²⁺ with porphyrin ring (biological)", "Cisplatin: [Pt(NH₃)₂Cl₂] — anticancer drug", "EDTA: hexadentate ligand used in complexometric titrations", "Photography: AgBr dissolved by Na₂[Ag(S₂O₃)₂]", "Color of complexes: determined by d-d transitions and CFSE"] }
      ]
    },
    Electrochemistry: {
      title: "Electrochemistry — Detailed JEE Summary",
      sections: [
        { heading: "Electrochemical Cells", points: ["Galvanic cell: spontaneous reaction produces electricity", "Electrolytic cell: external current drives non-spontaneous reaction", "Salt bridge: maintains electrical neutrality", "Anode: oxidation occurs (negative terminal in galvanic)", "Cathode: reduction occurs (positive terminal in galvanic)"] },
        { heading: "Nernst Equation & EMF", points: ["$E = E^\\circ - \\frac{0.059}{n}\\log Q$ at 25°C", "At equilibrium: $E = 0$ and $Q = K$", "$E^\\circ_{cell} = E^\\circ_{cathode} - E^\\circ_{anode}$", "$\\Delta G^\\circ = -nFE^\\circ$ (link to thermodynamics)", "Higher $E^\\circ$ = stronger oxidizing agent"], keyFormula: "$\\Delta G^\\circ = -nFE^\\circ$" },
        { heading: "Electrolysis & Faraday's Laws", points: ["First law: $m = ZIt = \\frac{MIt}{nF}$", "Second law: $\\frac{m_1}{m_2} = \\frac{E_1}{E_2}$ (equivalent weights)", "F = 96,485 C/mol (Faraday constant)", "Preferential discharge: ion with lower discharge potential deposited first", "Industrial uses: electroplating, extraction of Al (Hall-Héroult)"], keyFormula: "$m = \\frac{MIt}{nF}$" },
        { heading: "Conductivity", points: ["Specific conductivity: $\\kappa$ (S/cm)", "Molar conductivity: $\\Lambda_m = \\frac{\\kappa \\times 1000}{c}$", "Kohlrausch's law: $\\Lambda_m^\\circ = \\lambda^\\circ_+ + \\lambda^\\circ_-$", "Strong electrolytes: $\\Lambda_m$ decreases slightly with concentration", "Weak electrolytes: $\\Lambda_m$ increases sharply on dilution"], keyFormula: "$\\Lambda_m^\\circ = \\lambda^\\circ_+ + \\lambda^\\circ_-$" }
      ]
    }
  },
  Mathematics: {
    Calculus: {
      title: "Calculus — Complete JEE Summary",
      sections: [
        { heading: "Limits & Continuity", points: ["$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$", "L'Hôpital's Rule for $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$ forms", "Sandwich/Squeeze theorem for bounded limits", "Continuity: $\\lim_{x \\to a} f(x) = f(a)$", "Types of discontinuity: removable, jump, infinite"], keyFormula: "$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$" },
        { heading: "Differentiation", points: ["Product rule: $(uv)' = u'v + uv'$", "Chain rule: $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$", "Implicit differentiation for equations like $x^2 + y^2 = r^2$", "Maxima/Minima: $f'(x) = 0$, check second derivative", "Applications: rate of change, tangent/normal equations"], keyFormula: "$\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$" },
        { heading: "Integration", points: ["$\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$ (n ≠ -1)", "Integration by parts: $\\int u \\, dv = uv - \\int v \\, du$", "Substitution method for composite functions", "Partial fractions for rational functions", "Definite integrals: area under curve, Fundamental Theorem of Calculus"], keyFormula: "$\\int_a^b f(x)dx = F(b) - F(a)$" },
        { heading: "Differential Equations", points: ["Variable separable: $\\frac{dy}{dx} = g(x)h(y)$", "Linear DE: $\\frac{dy}{dx} + Py = Q$, IF = $e^{\\int P dx}$", "Homogeneous: substitute $y = vx$", "Exact DE: $M dx + N dy = 0$ where $\\frac{\\partial M}{\\partial y} = \\frac{\\partial N}{\\partial x}$", "Applications: growth/decay, Newton's cooling law"], keyFormula: "$\\text{IF} = e^{\\int P \\, dx}$" }
      ]
    },
    "Coordinate Geometry": {
      title: "Coordinate Geometry — Complete JEE Summary",
      sections: [
        { heading: "Straight Lines", points: ["Slope-intercept: $y = mx + c$", "Two-point form: $\\frac{y - y_1}{y_2 - y_1} = \\frac{x - x_1}{x_2 - x_1}$", "Distance from point to line: $d = \\frac{|ax_1 + by_1 + c|}{\\sqrt{a^2 + b^2}}$", "Angle between lines: $\\tan\\theta = \\left|\\frac{m_1 - m_2}{1 + m_1 m_2}\\right|$", "Family of lines: $L_1 + \\lambda L_2 = 0$"], keyFormula: "$d = \\frac{|ax_1 + by_1 + c|}{\\sqrt{a^2 + b^2}}$" },
        { heading: "Circles", points: ["Standard: $(x-h)^2 + (y-k)^2 = r^2$", "General: $x^2 + y^2 + 2gx + 2fy + c = 0$, center $(-g, -f)$, $r = \\sqrt{g^2 + f^2 - c}$", "Tangent at $(x_1, y_1)$: $xx_1 + yy_1 + g(x+x_1) + f(y+y_1) + c = 0$", "Length of tangent from external point: $\\sqrt{S_1}$"], keyFormula: "$r = \\sqrt{g^2 + f^2 - c}$" },
        { heading: "Conic Sections — Parabola & Ellipse", points: ["Parabola $y^2 = 4ax$: focus $(a,0)$, directrix $x = -a$", "Ellipse $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$: eccentricity $e = \\frac{c}{a}$ where $c^2 = a^2 - b^2$", "Parametric: parabola $(at^2, 2at)$, ellipse $(a\\cos\\theta, b\\sin\\theta)$", "Focal chord properties are frequently tested in JEE"], keyFormula: "$e = \\frac{c}{a}$ where $c^2 = a^2 - b^2$ (ellipse)" },
        { heading: "Hyperbola", points: ["Standard: $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$", "Eccentricity: $e = \\frac{c}{a}$ where $c^2 = a^2 + b^2$, $e > 1$", "Asymptotes: $y = \\pm\\frac{b}{a}x$", "Rectangular hyperbola: $xy = c^2$ (eccentricity $= \\sqrt{2}$)", "Conjugate hyperbola: $\\frac{y^2}{b^2} - \\frac{x^2}{a^2} = 1$"], keyFormula: "$c^2 = a^2 + b^2$ (hyperbola)" }
      ]
    },
    Algebra: {
      title: "Algebra — Complete JEE Summary",
      sections: [
        { heading: "Quadratic Equations", points: ["$ax^2 + bx + c = 0$: roots $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$", "Sum of roots: $\\alpha + \\beta = -\\frac{b}{a}$", "Product of roots: $\\alpha\\beta = \\frac{c}{a}$", "Discriminant: $D > 0$ (real), $D = 0$ (equal), $D < 0$ (complex)", "Nature of roots and graph of quadratic"], keyFormula: "$x = \\frac{-b \\pm \\sqrt{D}}{2a}$" },
        { heading: "Sequences & Series", points: ["AP: $a_n = a + (n-1)d$, $S_n = \\frac{n}{2}[2a + (n-1)d]$", "GP: $a_n = ar^{n-1}$, $S_n = \\frac{a(r^n - 1)}{r - 1}$", "Infinite GP sum: $S_\\infty = \\frac{a}{1-r}$ (|r| < 1)", "AM ≥ GM ≥ HM for positive numbers", "Telescoping series: differences cancel"], keyFormula: "$AM \\geq GM \\geq HM$" },
        { heading: "Matrices & Determinants", points: ["$|AB| = |A| \\cdot |B|$", "Inverse: $A^{-1} = \\frac{1}{|A|} \\text{adj}(A)$", "Cramer's rule for solving linear systems", "Properties of determinants: row/column operations", "Cayley-Hamilton: every matrix satisfies its characteristic equation"], keyFormula: "$A^{-1} = \\frac{\\text{adj}(A)}{|A|}$" },
        { heading: "Permutations & Combinations", points: ["$^nP_r = \\frac{n!}{(n-r)!}$", "$^nC_r = \\frac{n!}{r!(n-r)!}$", "Binomial theorem: $(a+b)^n = \\sum_{r=0}^{n} \\binom{n}{r} a^{n-r} b^r$", "Stars and bars: distributing identical objects", "Derangements: $D_n = n!\\sum_{i=0}^{n}\\frac{(-1)^i}{i!}$"], keyFormula: "$\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$" }
      ]
    },
    Probability: {
      title: "Probability — Complete JEE Summary",
      sections: [
        { heading: "Basic Probability", points: ["$P(A) = \\frac{\\text{favorable outcomes}}{\\text{total outcomes}}$", "Addition rule: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$", "Complementary: $P(A') = 1 - P(A)$", "Mutually exclusive: $P(A \\cap B) = 0$", "Sample space must be exhaustive and mutually exclusive"], keyFormula: "$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$" },
        { heading: "Conditional Probability & Bayes", points: ["$P(A|B) = \\frac{P(A \\cap B)}{P(B)}$", "Multiplication: $P(A \\cap B) = P(A) \\cdot P(B|A)$", "Independent events: $P(A \\cap B) = P(A) \\cdot P(B)$", "Bayes' theorem: $P(A_i|B) = \\frac{P(B|A_i)P(A_i)}{\\sum P(B|A_j)P(A_j)}$", "Total probability: $P(B) = \\sum P(B|A_i)P(A_i)$"], keyFormula: "$P(A|B) = \\frac{P(A \\cap B)}{P(B)}$" },
        { heading: "Distributions", points: ["Binomial: $P(X = r) = \\binom{n}{r} p^r q^{n-r}$", "Mean: $\\mu = np$, Variance: $\\sigma^2 = npq$", "Bernoulli trial: success (p) or failure (q = 1-p)", "Expected value: $E(X) = \\sum x_i P(x_i)$", "Variance: $\\text{Var}(X) = E(X^2) - [E(X)]^2$"], keyFormula: "$P(X=r) = \\binom{n}{r}p^r(1-p)^{n-r}$" }
      ]
    },
    Vectors: {
      title: "Vectors — Complete JEE Summary",
      sections: [
        { heading: "Vector Basics", points: ["Magnitude: $|\\vec{a}| = \\sqrt{a_x^2 + a_y^2 + a_z^2}$", "Unit vector: $\\hat{a} = \\frac{\\vec{a}}{|\\vec{a}|}$", "Position vector: $\\vec{r} = x\\hat{i} + y\\hat{j} + z\\hat{k}$", "Triangle law and parallelogram law of addition", "Section formula: $\\frac{m\\vec{b} + n\\vec{a}}{m+n}$"], keyFormula: "$\\hat{a} = \\frac{\\vec{a}}{|\\vec{a}|}$" },
        { heading: "Dot Product & Cross Product", points: ["$\\vec{a} \\cdot \\vec{b} = |a||b|\\cos\\theta = a_xb_x + a_yb_y + a_zb_z$", "$\\vec{a} \\times \\vec{b} = |a||b|\\sin\\theta \\hat{n}$", "Dot product = 0 → perpendicular", "Cross product = 0 → parallel", "Area of parallelogram = $|\\vec{a} \\times \\vec{b}|$"], keyFormula: "$\\vec{a} \\cdot \\vec{b} = |a||b|\\cos\\theta$" },
        { heading: "3D Geometry with Vectors", points: ["Direction cosines: $l^2 + m^2 + n^2 = 1$", "Equation of line: $\\vec{r} = \\vec{a} + t\\vec{b}$", "Equation of plane: $\\vec{r} \\cdot \\hat{n} = d$", "Distance from point to plane: $\\frac{|\\vec{a} \\cdot \\hat{n} - d|}{|\\hat{n}|}$", "Angle between planes = angle between their normals"], keyFormula: "$\\vec{r} = \\vec{a} + t\\vec{b}$ (line)" },
        { heading: "Scalar Triple Product", points: ["$[\\vec{a} \\vec{b} \\vec{c}] = \\vec{a} \\cdot (\\vec{b} \\times \\vec{c})$", "Volume of parallelepiped = $|[\\vec{a} \\vec{b} \\vec{c}]|$", "Coplanar vectors: $[\\vec{a} \\vec{b} \\vec{c}] = 0$", "Cyclic property: $[\\vec{a} \\vec{b} \\vec{c}] = [\\vec{b} \\vec{c} \\vec{a}] = [\\vec{c} \\vec{a} \\vec{b}]$"], keyFormula: "$V = |\\vec{a} \\cdot (\\vec{b} \\times \\vec{c})|$" }
      ]
    },
    Trigonometry: {
      title: "Trigonometry — Complete JEE Summary",
      sections: [
        { heading: "Basic Identities", points: ["$\\sin^2\\theta + \\cos^2\\theta = 1$", "$1 + \\tan^2\\theta = \\sec^2\\theta$", "$1 + \\cot^2\\theta = \\csc^2\\theta$", "$\\sin(-\\theta) = -\\sin\\theta$, $\\cos(-\\theta) = \\cos\\theta$"], keyFormula: "$\\sin^2\\theta + \\cos^2\\theta = 1$" },
        { heading: "Compound Angle Formulas", points: ["$\\sin(A+B) = \\sin A\\cos B + \\cos A\\sin B$", "$\\cos(A+B) = \\cos A\\cos B - \\sin A\\sin B$", "$\\tan(A+B) = \\frac{\\tan A + \\tan B}{1 - \\tan A\\tan B}$", "Double angle: $\\sin 2A = 2\\sin A\\cos A$", "$\\cos 2A = \\cos^2 A - \\sin^2 A = 2\\cos^2 A - 1$"], keyFormula: "$\\sin 2A = 2\\sin A\\cos A$" },
        { heading: "Inverse Trigonometric Functions", points: ["$\\sin^{-1}x + \\cos^{-1}x = \\frac{\\pi}{2}$", "$\\tan^{-1}x + \\cot^{-1}x = \\frac{\\pi}{2}$", "$\\tan^{-1}x + \\tan^{-1}y = \\tan^{-1}\\frac{x+y}{1-xy}$ (if $xy < 1$)", "Domain and range restrictions are crucial", "Principal value branch must be used"], keyFormula: "$\\sin^{-1}x + \\cos^{-1}x = \\frac{\\pi}{2}$" },
        { heading: "Solution of Triangles", points: ["Sine rule: $\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R$", "Cosine rule: $c^2 = a^2 + b^2 - 2ab\\cos C$", "Area: $\\Delta = \\frac{1}{2}ab\\sin C = \\sqrt{s(s-a)(s-b)(s-c)}$", "Incircle radius: $r = \\frac{\\Delta}{s}$", "Circumradius: $R = \\frac{abc}{4\\Delta}$"], keyFormula: "$\\frac{a}{\\sin A} = 2R$" }
      ]
    }
  }
};

// ════════════════════════════════════════════════════════════════
//  NEET INFOGRAPHICS
// ════════════════════════════════════════════════════════════════

const NEET_INFOGRAPHICS = {
  Physics: {
    Mechanics: JEE_INFOGRAPHICS.Physics.Mechanics, // same content works for NEET
    Electrostatics: JEE_INFOGRAPHICS.Physics.Electrodynamics, // reuse with same formulas
    "Current Electricity": {
      title: "Current Electricity — NEET Summary",
      sections: [
        { heading: "Ohm's Law & Resistance", points: ["$V = IR$ — voltage equals current times resistance", "$R = \\rho\\frac{l}{A}$ — resistance depends on material, length, area", "Resistivity increases with temperature for metals", "Color code: bands indicate resistance value", "Conductance: $G = \\frac{1}{R}$ (unit: siemens)"], keyFormula: "$R = \\rho\\frac{l}{A}$" },
        { heading: "Kirchhoff's Laws", points: ["Junction rule: total current in = total current out", "Loop rule: sum of potential differences around loop = 0", "Apply systematically to complex circuits", "Wheatstone bridge: balanced when $\\frac{P}{Q} = \\frac{R}{S}$"], keyFormula: "$\\frac{P}{Q} = \\frac{R}{S}$ (balance)" },
        { heading: "Cells & EMF", points: ["EMF = terminal voltage when no current flows", "Internal resistance: $V = \\mathcal{E} - Ir$", "Cells in series: $\\mathcal{E}_{total} = \\sum \\mathcal{E}_i$", "Cells in parallel: $\\frac{1}{r_{eq}} = \\sum \\frac{1}{r_i}$", "Maximum current when external R = internal r"], keyFormula: "$V = \\mathcal{E} - Ir$" },
        { heading: "Electrical Energy & Power", points: ["$P = VI = I^2R = \\frac{V^2}{R}$", "Energy: $E = Pt$ (measured in kWh for billing)", "Heating effect: $H = I^2Rt$ (Joule's law)", "Fuse wire: low melting point, high resistivity", "Power rating: appliances designed for specific voltage"], keyFormula: "$P = \\frac{V^2}{R}$" }
      ]
    },
    Optics: JEE_INFOGRAPHICS.Physics.Optics,
    "Modern Physics": JEE_INFOGRAPHICS.Physics["Modern Physics"],
    Thermodynamics: JEE_INFOGRAPHICS.Physics.Thermodynamics,
  },
  Chemistry: {
    "Organic Chemistry": JEE_INFOGRAPHICS.Chemistry["Organic Chemistry"],
    "Inorganic Chemistry": JEE_INFOGRAPHICS.Chemistry["Inorganic Chemistry"],
    "Physical Chemistry": JEE_INFOGRAPHICS.Chemistry["Physical Chemistry"],
    "Chemical Bonding": JEE_INFOGRAPHICS.Chemistry["Inorganic Chemistry"], // reuses bonding content
    "Coordination Compounds": JEE_INFOGRAPHICS.Chemistry["Coordination Compounds"],
  },
  Biology: {
    "Human Physiology": {
      title: "Human Physiology — NEET Summary",
      sections: [
        { heading: "Circulatory System", points: ["Double circulation: pulmonary + systemic circuits", "Heart: 4 chambers — 2 atria + 2 ventricles", "Cardiac cycle: 0.8 sec (systole + diastole)", "Blood pressure: normal 120/80 mmHg", "ECG waves: P (atrial), QRS (ventricular), T (repolarization)"] },
        { heading: "Respiratory System", points: ["Inspiration: diaphragm contracts, thorax expands, air rushes in", "Tidal volume: ~500 mL per breath", "Vital capacity: TV + IRV + ERV ≈ 3.5-4.5 L", "Gas exchange: O₂ binds hemoglobin (oxyhemoglobin)", "Bohr effect: increased CO₂ reduces O₂ affinity of Hb"] },
        { heading: "Excretory System", points: ["Nephron: functional unit of kidney", "Glomerular filtration → tubular reabsorption → secretion", "GFR: ~125 mL/min (180 L/day filtered, ~1.5 L urine)", "ADH: increases water reabsorption from collecting duct", "Aldosterone: increases Na⁺ reabsorption from DCT"] },
        { heading: "Nervous System", points: ["Neuron: dendrite → cell body → axon → synapse", "Resting potential: -70 mV (K⁺ leak channels)", "Action potential: Na⁺ influx → depolarization", "Synapse: neurotransmitter release (acetylcholine, dopamine)", "Reflex arc: receptor → afferent → CNS → efferent → effector"] }
      ]
    },
    "Plant Physiology": {
      title: "Plant Physiology — NEET Summary",
      sections: [
        { heading: "Photosynthesis", points: ["Light reactions: thylakoid membrane, produce ATP + NADPH", "PS II → PS I → NADP⁺ reductase", "Calvin cycle: CO₂ fixation by RuBisCO in stroma", "C3 plants: 3-PGA is first product", "C4 plants: OAA (4C) first, spatial separation of fixation", "CAM plants: temporal separation (night CO₂ fixation)"] },
        { heading: "Respiration", points: ["Glycolysis: glucose → 2 pyruvate (cytoplasm, 2 ATP)", "Krebs cycle: acetyl CoA → CO₂ (mitochondrial matrix, 2 ATP)", "ETC: NADH/FADH₂ → 34 ATP (inner mitochondrial membrane)", "Total yield: 36-38 ATP per glucose molecule", "Fermentation: anaerobic, produces ethanol or lactic acid"] },
        { heading: "Transport in Plants", points: ["Xylem: transpiration pull (cohesion-tension theory)", "Phloem: pressure flow hypothesis (Münch)", "Root pressure: pushes water up (guttation)", "Transpiration: 98% water lost through stomata", "Mineral absorption: active transport against concentration gradient"] },
        { heading: "Plant Growth & Hormones", points: ["Auxin: cell elongation, apical dominance, phototropism", "Gibberellins: stem elongation, seed germination, bolting", "Cytokinins: cell division, delay senescence", "Abscisic acid: stress hormone, stomatal closure", "Ethylene: fruit ripening, leaf abscission"] }
      ]
    },
    Genetics: {
      title: "Genetics & Evolution — NEET Summary",
      sections: [
        { heading: "Mendelian Genetics", points: ["Law of Dominance: dominant allele masks recessive", "Law of Segregation: alleles separate during gamete formation", "Law of Independent Assortment: genes on different chromosomes sort independently", "Monohybrid ratio: 3:1 (phenotypic), 1:2:1 (genotypic)", "Dihybrid ratio: 9:3:3:1"] },
        { heading: "Molecular Basis of Inheritance", points: ["DNA: double helix, antiparallel, complementary base pairing", "A=T (2 H-bonds), G≡C (3 H-bonds)", "Replication: semiconservative (Meselson-Stahl experiment)", "Central dogma: DNA → RNA → Protein", "Genetic code: triplet, degenerate, universal, non-overlapping"] },
        { heading: "Gene Expression", points: ["Transcription: DNA → mRNA (RNA polymerase)", "Translation: mRNA → protein (ribosomes, tRNA)", "Operon model: lac operon (inducible), trp operon (repressible)", "Post-translational modifications: folding, glycosylation", "Gene regulation occurs at transcriptional, translational, and post-translational levels"] },
        { heading: "Evolution", points: ["Darwin's natural selection: survival of the fittest", "Hardy-Weinberg equilibrium: $p^2 + 2pq + q^2 = 1$", "Genetic drift: random changes in small populations", "Speciation: allopatric (geographic) vs sympatric (same area)", "Evidences: fossils, homology, embryology, biogeography"] }
      ]
    },
    Ecology: {
      title: "Ecology — NEET Summary",
      sections: [
        { heading: "Ecosystem Structure", points: ["Producers → Primary consumers → Secondary → Tertiary", "Only 10% energy transfers between trophic levels", "Decomposers: break down dead organic matter", "Biotic: living components, Abiotic: non-living (light, temp, water)", "Food web: interconnected food chains"] },
        { heading: "Biogeochemical Cycles", points: ["Carbon cycle: photosynthesis ↔ respiration, fossil fuels", "Nitrogen cycle: N₂ fixation → nitrification → denitrification", "Phosphorus cycle: no gaseous phase, slowest cycle", "Water cycle: evaporation → condensation → precipitation", "Human impact: greenhouse gases, eutrophication"] },
        { heading: "Biodiversity & Conservation", points: ["Alpha diversity: within a habitat", "Beta diversity: between habitats", "Gamma diversity: across landscapes/regions", "IUCN Red List categories: CR, EN, VU, NT, LC", "In-situ: national parks, sanctuaries; Ex-situ: zoos, seed banks"] },
        { heading: "Population Ecology", points: ["Growth models: exponential ($dN/dt = rN$) vs logistic ($dN/dt = rN(K-N)/K$)", "Carrying capacity (K): maximum population environment can sustain", "r-selected: many offspring, less parental care", "K-selected: few offspring, more parental care", "Age pyramids: expanding, stable, declining"] }
      ]
    },
    "Cell Biology": {
      title: "Cell Biology — NEET Summary",
      sections: [
        { heading: "Cell Structure", points: ["Prokaryotic: no membrane-bound nucleus (bacteria)", "Eukaryotic: membrane-bound organelles", "Cell membrane: phospholipid bilayer (fluid mosaic model)", "Nucleus: nuclear envelope, chromatin, nucleolus", "Endoplasmic reticulum: rough (ribosomes) + smooth (lipid synthesis)"] },
        { heading: "Cell Division", points: ["Mitosis: equational division, 2 identical daughter cells", "Stages: Prophase → Metaphase → Anaphase → Telophase", "Meiosis: reductional, 4 haploid cells, crossing over in Prophase I", "Meiosis I: homologous separation; Meiosis II: sister chromatid separation", "Significance: genetic variation through crossing over and independent assortment"] },
        { heading: "Biomolecules", points: ["Carbohydrates: monosaccharides, disaccharides, polysaccharides", "Proteins: 20 amino acids, peptide bonds, 4 levels of structure", "Lipids: triglycerides, phospholipids, steroids", "Nucleic acids: DNA (deoxyribose) and RNA (ribose)", "Enzymes: biological catalysts, substrate specificity, lock-and-key model"] },
        { heading: "Cell Signaling & Transport", points: ["Passive transport: diffusion, osmosis, facilitated diffusion (no ATP)", "Active transport: against gradient, requires ATP (Na⁺/K⁺ pump)", "Endocytosis: phagocytosis (solids), pinocytosis (liquids)", "Exocytosis: secretion of substances outside cell", "Signal transduction: ligand → receptor → second messenger → response"] }
      ]
    },
    "Molecular Biology": {
      title: "Molecular Biology — NEET Summary",
      sections: [
        { heading: "DNA Structure & Replication", points: ["Watson-Crick model: double helix, 3.4 nm pitch, 10 bp per turn", "Chargaff's rule: A=T, G=C", "Semiconservative replication (Meselson-Stahl)", "Okazaki fragments on lagging strand", "DNA polymerase III: main replicating enzyme"], },
        { heading: "Transcription", points: ["Template strand read 3'→5', mRNA synthesized 5'→3'", "RNA polymerase: no primer needed", "Promoter: TATA box in eukaryotes", "Post-transcriptional: capping, tailing, splicing (introns removed)", "hnRNA → mRNA after processing"] },
        { heading: "Translation", points: ["Initiation: small ribosomal subunit + mRNA + initiator tRNA (AUG)", "Elongation: aminoacyl-tRNA enters A site, peptide bond, translocation", "Termination: stop codons (UAA, UAG, UGA) → release factors", "Polysome: multiple ribosomes on single mRNA", "Wobble hypothesis: relaxed base pairing at 3rd position of codon"] },
        { heading: "Gene Regulation & Biotechnology", points: ["Lac operon: inducible, lactose is inducer", "Restriction enzymes: molecular scissors (palindromic sequences)", "PCR: denaturation → annealing → extension (Taq polymerase)", "Gel electrophoresis: separates DNA by size", "Recombinant DNA technology: gene cloning using vectors (plasmids)"] }
      ]
    }
  }
};

// ════════════════════════════════════════════════════════════════
//  CUET INFOGRAPHICS
// ════════════════════════════════════════════════════════════════

const CUET_INFOGRAPHICS = {
  English: {
    "Reading Comprehension": {
      title: "Reading Comprehension — CUET Summary",
      sections: [
        { heading: "Types of RC Passages", points: ["Factual: data-driven, dates, statistics", "Literary: narrative, descriptive, figurative language", "Argumentative: opinion-based, cause-effect reasoning", "Scientific: technical vocabulary, process descriptions", "Typical length: 300-500 words with 5-8 questions"] },
        { heading: "Key Strategies", points: ["Skim first: get the main idea in 60 seconds", "Read questions before deep-reading the passage", "Identify topic sentence of each paragraph", "Eliminate clearly wrong options first", "Don't bring outside knowledge — answer from passage only"] },
        { heading: "Question Types", points: ["Main idea / title questions", "Inference questions: what can be concluded?", "Vocabulary in context: meaning of word as used", "Detail/fact-based: directly stated in passage", "Author's tone/purpose: persuade, inform, criticize, etc."] },
        { heading: "Common Traps", points: ["Too extreme: words like 'always', 'never', 'all'", "Partially correct: true statement but doesn't answer the question", "Out of scope: information not discussed in passage", "Reversed meaning: opposite of what passage states", "Look-alike: uses words from passage but changes meaning"] }
      ]
    },
    Vocabulary: {
      title: "Vocabulary Building — CUET Summary",
      sections: [
        { heading: "Word Roots Strategy", points: ["Latin/Greek roots help decode unknown words", "Pre- (before), Post- (after), Anti- (against)", "Ben/Bon (good): benevolent, bonus", "Mal (bad): malicious, malfunction", "Learn 10-15 roots to unlock hundreds of words"] },
        { heading: "Synonyms & Antonyms", points: ["Group words by meaning families", "Happy → elated, jubilant, ecstatic, euphoric", "Sad → melancholy, somber, dismal, morose", "Important → pivotal, paramount, crucial, vital", "Context determines which synonym fits best"] },
        { heading: "Idioms & Phrases", points: ["Break the ice: initiate conversation", "Bite the bullet: face difficulty bravely", "Burn the midnight oil: study/work late", "Hit the nail on the head: exactly right", "Under the weather: feeling ill"] },
        { heading: "One-Word Substitutions", points: ["Ambidextrous: able to use both hands equally", "Bibliophile: lover of books", "Contemporaries: people of the same time period", "Inevitable: cannot be avoided", "Philanthropy: love of humankind / charity"] }
      ]
    },
    Grammar: {
      title: "English Grammar — CUET Summary",
      sections: [
        { heading: "Tenses", points: ["Simple Present: habitual actions, universal truths", "Present Continuous: ongoing actions right now", "Past Perfect: action completed before another past action", "Future Perfect: will have completed by a certain time", "Subject-verb agreement: singular subject → singular verb"] },
        { heading: "Common Error Types", points: ["Subject-verb agreement: 'The list of items IS ready' (not are)", "Pronoun reference: pronoun must clearly refer to one noun", "Parallelism: items in a list must be same grammatical form", "Dangling modifier: modifier must be next to what it modifies", "Tense consistency: don't switch tenses within a sentence"] },
        { heading: "Active & Passive Voice", points: ["Active: Subject + Verb + Object", "Passive: Object + be + past participle + by Subject", "Simple Present: 'writes' → 'is written'", "Past Perfect: 'had written' → 'had been written'", "Use passive when doer is unknown or unimportant"] },
        { heading: "Sentence Improvement", points: ["Avoid redundancy: 'return back' → 'return'", "Conciseness: remove unnecessary words", "Correct preposition use: 'good at' not 'good in'", "Avoid double negatives", "Use 'fewer' for countable, 'less' for uncountable"] }
      ]
    },
    "Para Jumbles": {
      title: "Para Jumbles — CUET Summary",
      sections: [
        { heading: "Strategy", points: ["Find the opening sentence: introduces topic, no pronoun reference", "Find the closing sentence: concluding tone, summary", "Look for mandatory pairs: pronouns that refer to specific nouns", "Chronological/logical flow: cause → effect, general → specific", "Transition words connect sentences: however, moreover, therefore"] },
        { heading: "Linking Clues", points: ["Pronouns (he, she, it, they) must follow their noun", "'This/These/Such' refers to something just mentioned", "Articles: 'a/an' introduces, 'the' refers to already mentioned", "Time markers: first, then, later, finally", "Contrast: but, however, nevertheless, on the other hand"] },
        { heading: "Common Patterns", points: ["Introduction → Example → Analysis → Conclusion", "Problem → Cause → Effect → Solution", "Claim → Evidence → Counter → Resolution", "General statement → Specific details → Summary", "Chronological: earliest event to latest"] }
      ]
    },
    "Error Spotting": {
      title: "Error Spotting — CUET Summary",
      sections: [
        { heading: "Grammar-Based Errors", points: ["Subject-verb agreement: check singular/plural match", "Tense errors: maintain consistency within sentences", "Article errors: a/an/the usage", "Preposition errors: depend on, consist of, good at", "Pronoun errors: correct case (I/me, who/whom)"] },
        { heading: "Vocabulary-Based Errors", points: ["Confusing words: affect/effect, principal/principle", "Wrong word form: noun used instead of adjective", "Redundancy: 'free gift' (gift is already free)", "Malapropism: similar-sounding wrong word", "Collocation errors: 'do a mistake' → 'make a mistake'"] },
        { heading: "Approach", points: ["Read the complete sentence first", "Check each part independently", "Most errors are in subject-verb or tense", "If no error found, 'No Error' is a valid option", "Don't overthink — go with your first instinct after analysis"] }
      ]
    }
  },
  "General Test": {
    "Quantitative Aptitude": {
      title: "Quantitative Aptitude — CUET Summary",
      sections: [
        { heading: "Number System", points: ["Divisibility rules: 2 (even), 3 (digit sum), 4 (last 2 digits)", "HCF × LCM = Product of two numbers", "Remainder theorem for large powers", "Unit digit cycles: 2→2,4,8,6; 3→3,9,7,1", "Perfect squares end in 0,1,4,5,6,9 only"] },
        { heading: "Percentage & Profit-Loss", points: ["Percentage change = (Change/Original) × 100", "Profit% = (Profit/CP) × 100", "Discount% = (Discount/MP) × 100", "SP = CP × (1 + Profit%/100)", "Successive discounts: apply one after another"] },
        { heading: "Time, Speed & Distance", points: ["Speed = Distance/Time", "Average speed (same distance) = 2ab/(a+b)", "Relative speed: same direction (subtract), opposite (add)", "Boats: upstream speed = boat - stream", "Trains: add lengths when crossing each other"] },
        { heading: "Ratio, Proportion & Mixtures", points: ["a:b = c:d → ad = bc (cross multiply)", "Mixture problems: use alligation method", "Partnership: profit shared in ratio of (capital × time)", "Compound ratio: (a:b) × (c:d) = ac:bd", "Variation: direct (y = kx), inverse (y = k/x)"] }
      ]
    },
    "Logical Reasoning": {
      title: "Logical Reasoning — CUET Summary",
      sections: [
        { heading: "Coding-Decoding", points: ["Letter shifting: each letter shifted by fixed positions", "Reverse coding: ABCD → ZYXW pattern", "Number coding: assign numbers to letters", "Mixed coding: symbols + numbers + letters", "Look for patterns in given examples first"] },
        { heading: "Blood Relations", points: ["Draw family trees top-down", "Father's/Mother's brother = Uncle", "Father's/Mother's sister = Aunt", "Use gender symbols: M (male), F (female)", "Questions often chain 3-4 relationships"] },
        { heading: "Syllogisms", points: ["All A are B + All B are C → All A are C", "Some A are B + All B are C → Some A are C", "No A are B → No B are A (converse)", "Use Venn diagrams to visualize", "Possibility questions: draw all valid diagrams"] },
        { heading: "Series & Pattern Recognition", points: ["Number series: check differences, ratios, squares, cubes", "Letter series: position-based patterns (A=1, B=2...)", "Figure series: rotation, addition, mirror image patterns", "Odd one out: find the common property of others", "Missing number in matrix: row/column operations"] }
      ]
    },
    "Data Interpretation": {
      title: "Data Interpretation — CUET Summary",
      sections: [
        { heading: "Bar & Line Graphs", points: ["Read axes carefully (scale, units)", "Compare heights/points for trends", "Calculate percentage change between years", "Average = sum of values / number of values", "Look for maximum and minimum values quickly"] },
        { heading: "Pie Charts", points: ["Full circle = 360° = 100%", "Sector angle = (value/total) × 360", "Compare sectors by angle or percentage", "Often combined with total value for actual numbers", "Two pie charts: compare ratios, not absolute values"] },
        { heading: "Tables & Mixed Data", points: ["Scan table structure before reading questions", "Calculate row totals and column totals mentally", "Use approximation for speed (round to nearest 5 or 10)", "Questions often ask: highest growth, lowest share, ratio", "Cross-reference multiple tables when needed"] }
      ]
    },
    "General Knowledge": {
      title: "General Knowledge — CUET Summary",
      sections: [
        { heading: "Indian Constitution", points: ["Preamble: Sovereign, Socialist, Secular, Democratic, Republic", "Fundamental Rights: Articles 14-32", "Directive Principles: Articles 36-51 (non-justiciable)", "Fundamental Duties: Article 51A (added by 42nd Amendment)", "Amendment process: Article 368"] },
        { heading: "Indian Geography", points: ["Longest river: Ganga (2,525 km in India)", "Highest peak: Kangchenjunga (in India, 8,586m)", "Largest state by area: Rajasthan", "Climate: tropical monsoon, southwest monsoon (June-Sept)", "Major crops: rice (kharif), wheat (rabi), cotton (cash crop)"] },
        { heading: "Science & Technology", points: ["ISRO: Chandrayaan, Mangalyaan missions", "Nuclear power plants: Kudankulam, Tarapur, Kalpakkam", "IT hubs: Bengaluru, Hyderabad, Pune", "Defence: Agni, Prithvi missiles; INS Vikrant aircraft carrier", "Space achievements: Gaganyaan (crewed mission program)"] },
        { heading: "Awards & Organizations", points: ["Nobel Prize: awarded in Stockholm (Peace in Oslo)", "Bharat Ratna: highest civilian award in India", "UN bodies: WHO, UNESCO, UNICEF, ILO, FAO", "G20: India hosted presidency in 2023", "BRICS: Brazil, Russia, India, China, South Africa (expanded 2024)"] }
      ]
    }
  },
  "Domain Subject": {
    "Indian History": {
      title: "Indian History — CUET Summary",
      sections: [
        { heading: "Ancient India", points: ["Indus Valley Civilization: Harappa, Mohenjo-daro (2500-1500 BCE)", "Vedic period: Rigveda (oldest), caste system origins", "Maurya Empire: Chandragupta, Ashoka (Dhamma policy)", "Gupta Empire: Golden Age — Aryabhata, Kalidasa", "Buddhist councils and Jain traditions"] },
        { heading: "Medieval India", points: ["Delhi Sultanate: 5 dynasties (1206-1526)", "Mughal Empire: Babur → Aurangzeb", "Akbar: Din-i-Ilahi, Mansabdari system, religious tolerance", "Bhakti & Sufi movements: Kabir, Nanak, Khwaja Moinuddin Chishti", "Vijayanagara Empire: Krishnadevaraya, Hampi"] },
        { heading: "Modern India", points: ["British East India Company: Battle of Plassey (1757)", "1857 Revolt: first major uprising against British", "Indian National Congress (1885): moderate → extremist phases", "Gandhi: Non-Cooperation, Civil Disobedience, Quit India", "Independence: August 15, 1947; Republic: January 26, 1950"] },
        { heading: "National Movement Key Events", points: ["Partition of Bengal (1905): Swadeshi movement", "Jallianwala Bagh massacre (1919): turning point", "Salt March (1930): Dandi — civil disobedience", "Cabinet Mission (1946): proposed unified India plan", "Mountbatten Plan (1947): partition and independence"] }
      ]
    },
    Geography: {
      title: "Geography — CUET Summary",
      sections: [
        { heading: "Physical Geography", points: ["Earth's layers: crust, mantle, outer core, inner core", "Plate tectonics: convergent, divergent, transform boundaries", "Rock cycle: igneous → sedimentary → metamorphic", "Weathering: physical, chemical, biological breakdown", "Landforms: mountains, plateaus, plains, deltas"] },
        { heading: "Indian Geography", points: ["Physical divisions: Himalayas, Indo-Gangetic Plain, Peninsular Plateau, Coastal Plains, Islands", "Rivers: Himalayan (perennial), Peninsular (seasonal)", "Climate: tropical monsoon, 4 seasons", "Soil types: alluvial, black, red, laterite", "Natural vegetation: tropical forest, deciduous, thorn, alpine"] },
        { heading: "Human Geography", points: ["Population distribution: factors — climate, terrain, resources", "Urbanization: push-pull factors, megacities", "Agriculture types: subsistence, commercial, plantation", "Industries: agro-based, mineral-based, knowledge-based", "Transport: road, rail, air, water — importance of each"] }
      ]
    },
    Polity: {
      title: "Indian Polity — CUET Summary",
      sections: [
        { heading: "Constitution Basics", points: ["Longest written constitution in the world", "Originally 395 Articles, 8 Schedules, 22 Parts", "Federal structure with unitary bias", "Parliamentary system: executive responsible to legislature", "Borrowed features: UK (parliamentary), US (fundamental rights), Ireland (DPSP)"] },
        { heading: "Union Government", points: ["President: nominal head, elected by electoral college", "Prime Minister: real executive head, leader of Lok Sabha majority", "Parliament: Lok Sabha (543 elected) + Rajya Sabha (245)", "Money bill: introduced only in Lok Sabha", "Judicial review: Supreme Court can strike down unconstitutional laws"] },
        { heading: "State Government & Local Bodies", points: ["Governor: appointed by President, constitutional head", "Chief Minister: real executive, majority in Vidhan Sabha", "73rd Amendment: Panchayati Raj (3-tier system)", "74th Amendment: Municipalities (urban local bodies)", "Finance Commission: recommends tax distribution (Centre-State)"] },
        { heading: "Rights & Duties", points: ["Right to Equality (Art 14-18)", "Right to Freedom (Art 19-22)", "Right against Exploitation (Art 23-24)", "Right to Freedom of Religion (Art 25-28)", "Right to Constitutional Remedies (Art 32) — 'Heart of Constitution'"] }
      ]
    },
    Economics: {
      title: "Economics — CUET Summary",
      sections: [
        { heading: "Microeconomics Basics", points: ["Demand: inverse relationship with price (law of demand)", "Supply: direct relationship with price (law of supply)", "Equilibrium: where demand meets supply", "Elasticity: responsiveness of demand/supply to price change", "Market structures: perfect competition, monopoly, oligopoly"] },
        { heading: "Indian Economy", points: ["GDP: total value of goods and services produced", "Sectors: primary (agriculture), secondary (industry), tertiary (services)", "Services sector: largest contributor to India's GDP (~55%)", "FDI: foreign direct investment — manufacturing, telecom, IT", "Make in India: initiative to boost manufacturing"] },
        { heading: "Money & Banking", points: ["RBI: central bank, monetary policy authority", "Repo rate: rate at which RBI lends to banks", "Reverse repo: rate at which banks deposit with RBI", "CRR/SLR: mandatory reserves banks must maintain", "Inflation: sustained increase in general price level"] },
        { heading: "Government Budget & Fiscal Policy", points: ["Revenue receipt: tax + non-tax income", "Capital receipt: loans, disinvestment", "Fiscal deficit: total expenditure - total receipts (excl. borrowings)", "Revenue deficit: revenue expenditure - revenue receipts", "Primary deficit: fiscal deficit - interest payments"] }
      ]
    },
    "Current Affairs": {
      title: "Current Affairs — CUET Focus Areas",
      sections: [
        { heading: "International Organizations", points: ["UN Security Council: 5 permanent members (P5) with veto power", "G20: 19 countries + EU + AU; India hosted 2023", "BRICS: expanded to include new members in 2024", "SCO: Shanghai Cooperation Organisation — security focus", "QUAD: US, India, Japan, Australia — Indo-Pacific security"] },
        { heading: "Government Schemes", points: ["Ayushman Bharat: health insurance for 50 crore beneficiaries", "PM Kisan: Rs 6000/year to farmer families", "Digital India: e-governance, internet connectivity", "Swachh Bharat: sanitation and cleanliness mission", "Startup India: support ecosystem for entrepreneurs"] },
        { heading: "Science & Space", points: ["Chandrayaan-3: successful lunar south pole landing (Aug 2023)", "Aditya-L1: India's solar observation mission", "Gaganyaan: India's human spaceflight program", "AI developments: impact on education, healthcare, governance", "Climate: Paris Agreement targets, COP summits"] },
        { heading: "Awards & Sports", points: ["Bharat Ratna: highest civilian honor", "Padma awards: Vibhushan, Bhushan, Shri categories", "Cricket: ICC tournaments, IPL developments", "Olympics: India's medal tallies and key athletes", "Khel Ratna: renamed Major Dhyan Chand Khel Ratna"] }
      ]
    }
  }
};


// ════════════════════════════════════════════════════════════════
//  SLIDES — Generate from infographic data
// ════════════════════════════════════════════════════════════════

function infographicToSlides(infographic) {
  const slides = [];
  // Title slide
  slides.push({
    slideNumber: 1,
    title: infographic.title,
    bulletPoints: ["Comprehensive topic summary", "Key formulas and concepts", `${infographic.sections.length} sections covered`],
    speakerNotes: "Introduction slide for the topic overview."
  });
  // Content slides from each section
  infographic.sections.forEach((section, idx) => {
    const slidePoints = section.points.slice(0, 5); // max 5 bullets
    if (section.keyFormula) {
      slidePoints.push(`Key Formula: ${section.keyFormula}`);
    }
    slides.push({
      slideNumber: idx + 2,
      title: section.heading,
      bulletPoints: slidePoints,
      speakerNotes: `Covers the key concepts of ${section.heading}. Focus on formulas and their applications.`
    });
  });
  // Summary slide
  slides.push({
    slideNumber: slides.length + 1,
    title: "Quick Revision Summary",
    bulletPoints: infographic.sections.map(s => `${s.heading}: ${s.points[0]}`),
    speakerNotes: "Quick revision of all topics covered. Review key formulas before moving on."
  });
  return slides;
}


// ════════════════════════════════════════════════════════════════
//  MAIN SEEDER
// ════════════════════════════════════════════════════════════════

async function seed() {
  const allInfographics = {
    JEE: JEE_INFOGRAPHICS,
    NEET: NEET_INFOGRAPHICS,
    CUET: CUET_INFOGRAPHICS,
  };

  let total = 0;
  let created = 0;
  let skipped = 0;
  let errored = 0;

  // Count total
  for (const exam of Object.keys(allInfographics)) {
    for (const subject of Object.keys(allInfographics[exam])) {
      total += Object.keys(allInfographics[exam][subject]).length * 2; // infographic + slides
    }
  }

  console.log(`\n🚀 Seeding ${total} documents (infographics + slides) into Firestore...\n`);

  for (const exam of Object.keys(allInfographics)) {
    for (const subject of Object.keys(allInfographics[exam])) {
      for (const topic of Object.keys(allInfographics[exam][subject])) {
        const infographic = allInfographics[exam][subject][topic];

        // ── Infographic ──
        const infoId = docId('infographics', exam, subject, topic);
        try {
          const existing = await db.collection('studyContent').doc(infoId).get();
          if (existing.exists) {
            console.log(`⏩ SKIP ${exam}/${subject}/${topic} (infographics)`);
            skipped++;
          } else {
            await db.collection('studyContent').doc(infoId).set({
              content: infographic,
              mode: 'infographics',
              exam, subject, topic,
              createdAt: new Date().toISOString(),
            });
            console.log(`✅ ${exam}/${subject}/${topic} (infographics)`);
            created++;
          }
        } catch (e) {
          console.error(`❌ ${exam}/${subject}/${topic} (infographics):`, e.message);
          errored++;
        }

        // ── Slides ──
        const slidesData = infographicToSlides(infographic);
        const slideId = docId('slides', exam, subject, topic);
        try {
          const existing = await db.collection('studyContent').doc(slideId).get();
          if (existing.exists) {
            console.log(`⏩ SKIP ${exam}/${subject}/${topic} (slides)`);
            skipped++;
          } else {
            await db.collection('studyContent').doc(slideId).set({
              content: slidesData,
              mode: 'slides',
              exam, subject, topic,
              createdAt: new Date().toISOString(),
            });
            console.log(`✅ ${exam}/${subject}/${topic} (slides)`);
            created++;
          }
        } catch (e) {
          console.error(`❌ ${exam}/${subject}/${topic} (slides):`, e.message);
          errored++;
        }
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Created: ${created}`);
  console.log(`⏩ Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${errored}`);
  console.log(`📊 Total:   ${total}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(0);
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
