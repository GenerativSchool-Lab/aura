"""
Clinical Scoring System based on ERC 2021, SFAR 2024, and French triage algorithms
Supports both pediatric and adult patients
"""

# Cardiovascular System Signs (0-100 scale)
CARDIOVASCULAR_SIGNS = {
    "arrêt_cardiaque": 100,
    "choc_cardiogénique": 95,
    "tachycardie_extrême": 90,  # >220/min (infant) or >180/min (adult)
    "bradycardie_sévère": 85,  # <60/min with signs
    "cyanose_centrale": 80,
    "pouls_filants": 75,
    "douleur_thoracique_dyspnée": 70,
    "hypertension_sévère": 65,
    "souffle_cardiaque_pathologique": 60,
    "œdème_poumon_aigu": 85,
}

# Respiratory System Signs (0-100 scale)
RESPIRATORY_SIGNS = {
    "apnée": 95,
    "détresse_respiratoire_sévère": 90,
    "tirage_intercostal": 85,
    "cyanose": 80,
    "stridor_inspiratoire": 75,
    "toux_coqueluchoïde": 70,
    "wheezing_diffus": 65,
    "fréquence_respiratoire_élevée": 60,  # >70/min (infant) or >30/min (adult)
    "expectoration_sanglante": 80,
}

# Neurological System Signs (0-100 scale)
NEUROLOGICAL_SIGNS = {
    "coma": 100,  # Glasgow < 8
    "convulsions_prolongées": 95,  # >5 min
    "raideur_nuque": 90,
    "déficit_moteur_brutal": 85,
    "céphalées_vomissements_jet": 80,
    "troubles_conscience": 75,
    "mouvements_anormaux": 70,
}

# Digestive System Signs (0-100 scale)
DIGESTIVE_SIGNS = {
    "hémorragie_digestive_haute": 90,
    "occlusion_intestinale": 85,
    "péritonite": 80,
    "déshydratation_sévère": 75,
    "diarrhée_sanglante": 70,
}

# General Signs (0-100 scale)
GENERAL_SIGNS = {
    "marbrures": 85,
    "refus_boire_alimentaire": 90,  # Especially in infants
    "fièvre_élevée": 80,  # >39°C with other signs
    "hypothermie": 75,  # <35°C
    "signes_choc": 90,
    "oligurie": 80,
    "altération_état_général": 70,
}

# All signs combined for lookup
ALL_CLINICAL_SIGNS = {
    **CARDIOVASCULAR_SIGNS,
    **RESPIRATORY_SIGNS,
    **NEUROLOGICAL_SIGNS,
    **DIGESTIVE_SIGNS,
    **GENERAL_SIGNS,
}

def get_severity_level_from_score(score_100: float) -> tuple[str, str]:
    """
    Get severity level and urgency from clinical score (0-100)
    Returns: (severity_level, urgency)
    """
    if score_100 >= 90:
        return ("Critical", "Immediate")
    elif score_100 >= 70:
        return ("High", "Urgent")
    elif score_100 >= 50:
        return ("Moderate", "Moderate")
    elif score_100 >= 30:
        return ("Low", "Low")
    else:
        return ("Non-urgent", "Non-urgent")

def get_triage_category(score_100: float) -> dict:
    """
    Get triage category based on clinical score (0-100)
    Returns: {category, urgency, action}
    """
    if score_100 >= 90:
        return {
            "category": "Urgence vitale",
            "urgency": "Immediate",
            "action": "Réanimation immédiate, appel SAMU/réanimation"
        }
    elif score_100 >= 70:
        return {
            "category": "Urgence majeure",
            "urgency": "Urgent",
            "action": "Hospitalisation en unité de soins continus"
        }
    elif score_100 >= 50:
        return {
            "category": "Urgence relative",
            "urgency": "Moderate",
            "action": "Consultation en urgence (< 2h)"
        }
    else:
        return {
            "category": "Non urgent",
            "urgency": "Low",
            "action": "Consultation programmée ou retour à domicile"
        }

def get_clinical_scoring_guidelines(patient_age: int = None) -> str:
    """
    Generate clinical scoring guidelines for the AI prompt
    """
    age_group = "pédiatrique" if patient_age and patient_age < 18 else "adulte"
    
    guidelines = f"""
SYSTÈME DE SCORING CLINIQUE ({age_group.upper()})
Basé sur ERC 2021, SFAR 2024, et algorithmes de triage français

ÉVALUATION PAR APPAREIL (Score 0-100 par signe):

1. APPAREIL CARDIO-VASCULAIRE:
   - Arrêt cardiaque: 100 (RCP immédiate)
   - Choc cardiogénique: 95 (PA systolique < 60-70 mmHg, marbrures, oligurie)
   - Tachycardie extrême: 90 (>220/min nourrisson, >180/min adulte)
   - Bradycardie sévère: 85 (<60/min avec signes de bas débit)
   - Cyanose centrale: 80 (SaO₂ < 85%)
   - Pouls filants: 75 (signes de choc compensé)
   - Douleur thoracique + dyspnée: 70 (suspicion ischémie)
   - Hypertension sévère: 65 (PA > 99e percentile + signes neuro)
   - Œdème aigu du poumon: 85

2. APPAREIL RESPIRATOIRE:
   - Apnée: 95 (pause >20 sec)
   - Détresse respiratoire sévère: 90 (Silverman >8, SaO₂ <90%)
   - Tirage intercostal/sous-costal: 85
   - Cyanose: 80
   - Stridor inspiratoire: 75 (épiglottite possible)
   - Expectoration sanglante: 80
   - Wheezing diffus: 65 (asthme sévère)
   - Fréquence respiratoire élevée: 60 (>70/min nourrisson, >30/min adulte)

3. APPAREIL NEUROLOGIQUE:
   - Coma (Glasgow <8): 100
   - Convulsions prolongées (>5 min): 95
   - Raideur de nuque: 90 (méningite possible)
   - Déficit moteur brutal: 85 (AVC, traumatisme)
   - Céphalées + vomissements en jet: 80 (HTIC)
   - Troubles de conscience: 75

4. APPAREIL DIGESTIF:
   - Hémorragie digestive haute: 90
   - Occlusion intestinale: 85
   - Péritonite: 80
   - Déshydratation sévère: 75
   - Diarrhée sanglante: 70

5. SIGNES GÉNÉRAUX:
   - Refus boire/alimentaire: 90 (surtout nourrisson)
   - Marbrures: 85
   - Signes de choc: 90
   - Fièvre élevée + autres signes: 80 (>39°C)
   - Oligurie: 80

ALGORITHME DE TRIAGE:
- Score ≥90: Urgence vitale → Réanimation immédiate
- Score 70-89: Urgence majeure → Hospitalisation soins continus
- Score 50-69: Urgence relative → Consultation urgence (<2h)
- Score <50: Non urgent → Consultation programmée

CATÉGORISATION PAR SCORE (0-100):
- Score 90-100 → Critical / Immediate (Urgence vitale)
- Score 70-89 → High / Urgent (Urgence majeure)
- Score 50-69 → Moderate / Moderate (Urgence relative)
- Score 30-49 → Low / Low (Non urgent)
- Score 0-29 → Non-urgent / Non-urgent (Non urgent)

INSTRUCTIONS (CONCIS):
1. Identifier TOUS les signes cliniques présents
2. Assigner score 0-100 pour chaque signe selon tables
3. Prendre SCORE MAXIMUM (pas moyenne) pour gravité
4. Déterminer severity_level et urgency selon mapping score
5. Justifier brièvement chaque signe dans reasoning (format structuré)
"""
    return guidelines

