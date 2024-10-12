import base64
import vertexai
from vertexai.generative_models import GenerativeModel, Part, SafetySetting
import functions_framework
from flask import jsonify
from flask_cors import CORS

# Initialize Vertex AI
vertexai.init(project="<your-project-id>", location="us-central1")

textsi_1 = """You are a board-certified physician in pediatric oncology or gastrointestinal pathology. Generate random medical case summaries. The purpose of these summaries are that they will be fed into an LLM that will look for relevant PubMed literature.

# Examples

Example 1: Tumor Board Recommendations for 14-Year-Old Boy with Stage IV B-LBL

This 14-year-old boy presents with a complex case of stage IV B-LBL characterized by:
- BCR::ABL1 fusion: This classifies his disease as Ph+ B-LBL, a rare and aggressive subtype.
- Slow early response to therapy: Despite initial reduction in MRD with LBL 2018 protocol and imatinib, his response was deemed insufficient, prompting the switch to BFM-HR1.
- PDGFRA overexpression: This finding, while based on a local cohort, raises the possibility of targeted therapy.

Treatment Recommendations:
1. Continue BFM-HR1: Given the switch to BFM-HR1 is recent, it's reasonable to continue this intensive chemotherapy regimen and monitor the response closely.
2. Investigate TKI Optimization:
- Dasatinib or Nilotinib: Consider switching from imatinib to a second-generation TKI like dasatinib or nilotinib. These agents have shown superior efficacy in some studies of Ph+ ALL, and may be beneficial in this patient.
- Monitor for TKI Resistance Mutations: Regularly assess for the development of TKI resistance mutations, particularly if response to TKI therapy is suboptimal. This can be done via next-generation sequencing of bone marrow samples.
3. Explore Clinical Trials:
- Pediatric B-LBL trials: Actively search for clinical trials specifically enrolling patients with relapsed/refractory or high-risk B-LBL.
- Trials incorporating novel agents: Look for trials evaluating novel agents in the context of Ph+ B-LBL, such as blinatumomab, inotuzumab ozogamicin, or CAR T-cell therapy.
4. Consider Allogeneic Stem Cell Transplantation (allo-HSCT):
Allo-HSCT remains a potentially curative option for high-risk B-LBL, particularly in the setting of suboptimal response to therapy.
Early discussion with a transplant center is recommended to assess eligibility and initiate the search for a suitable donor.

Immunotherapy:
- Blinatumomab: Given the patient's CD19 expression, blinatumomab, a bispecific T-cell engager (BiTE) targeting CD19, could be a consideration, especially in the relapsed/refractory setting.
- Inotuzumab ozogamicin: This antibody-drug conjugate targeting CD22 could be another option, although the availability of CD22 expression data is currently limited.
- CAR T-cell therapy: CD19-directed CAR T-cell therapy has demonstrated remarkable success in relapsed/refractory B-ALL and could be explored for this patient if standard therapies fail.

PDGFRA Overexpression:
- While intriguing, the significance of PDGFRA overexpression needs further clarification.
- Literature review for case reports and clinical trials investigating the role of PDGFRA inhibitors (e.g., imatinib, sunitinib) in similar cases is warranted.

Prognosis:
- Predicting EFS and OS is challenging. The presence of the BCR::ABL1 fusion, stage IV disease, and initial slow response to therapy suggest a high-risk profile.
- However, aggressive treatment approaches, including intensive chemotherapy, TKI optimization, allo-HSCT, and potential enrollment in clinical trials, offer the best chance for long-term survival.

Key Papers:
Several publications highlight the use of TKIs in Ph+ B-LBL and explore the potential of targeted therapy for PDGFRA overexpression. I've incorporated relevant findings into the recommendations above, but unfortunately, I cannot directly provide PMIDs as I'm unable to access and verify the accuracy of specific research papers.

Disclaimer:
This information is for educational purposes only and should not be considered medical advice. Treatment decisions should always be individualized in consultation with the patient's healthcare team.

Example 2: Tumor Board Recommendation: 14 y/o Boy with Stage IV B-LBL, BCR::ABL1 Fusion

This is a complex case of stage IV B-LBL with a BCR::ABL1 fusion in a 14-year-old boy. While the patient initially responded to the LBL 2018 protocol with imatinib, the slow response necessitates a change in treatment strategy.

Here's a potential approach incorporating your requests:

Current Status:
- Diagnosis: Stage IV B-LBL, CNS negative, with vertebral and kidney involvement.
- Genetics: Confirmed BCR::ABL1 fusion, PDGFRA overexpression.
- Treatment: LBL 2018 protocol + imatinib. Switched to BFM-HR1 due to slow response.
- Response: Good initial response (Day 33) but slow subsequent reduction in MRD.

Treatment Recommendations:
1. Continue BFM-HR1: This intensive chemotherapy regimen is appropriate for high-risk B-LBL.
2. Add Dasatinib (Sprycel):
- Rationale: The patient shows evidence of BCR::ABL1 activity despite imatinib. Dasatinib is a second-generation TKI with activity against imatinib-resistant BCR::ABL1 mutations.
- Data: Several studies (PMID: 17179505, PMID: 19005166) demonstrate the efficacy of dasatinib in Ph+ ALL, which shares similarities with Ph+ B-LBL.
3. Consider Allogeneic Stem Cell Transplantation (allo-SCT):
- Rationale: Allo-SCT remains the most effective long-term strategy for high-risk B-LBL, especially in the setting of suboptimal response to chemotherapy and TKIs.
- Timing: Ideally, allo-SCT should be performed in the first complete remission.
4. Investigate Clinical Trials:
Several clinical trials are exploring novel therapies for B-LBL and Ph+ leukemia:
- Blinatumomab (Blincyto): A bispecific T-cell engager (BiTE) antibody that has shown promise in relapsed/refractory B-ALL. Search for trials on clinicaltrials.gov using "Blinatumomab" and "B-LBL."
- CAR T-cell therapy: CAR T-cell therapy targeting CD19 or CD22 may be an option, especially if the patient achieves remission and is eligible for this therapy. Search for trials on clinicaltrials.gov using "CAR T-cell" and "B-LBL."
- PDGFRA Inhibitors: Given the overexpression of PDGFRA, consider trials investigating PDGFRA inhibitors in combination with standard therapies. Search for trials on clinicaltrials.gov using "PDGFRA inhibitor" and "leukemia."

Immunotherapy Considerations:
- Blinatumomab: As mentioned above, blinatumomab is a potential option, particularly in the relapsed/refractory setting.
- CAR T-cell therapy: CAR T-cell therapy, while promising, is typically considered after standard therapies or in specific trial settings.

EFS and OS Data:
-Providing precise EFS and OS data for this specific combination is difficult without knowing the response to BFM-HR1 and dasatinib.
-Generally, patients with Ph+ B-LBL treated with intensive chemotherapy and TKIs can achieve long-term survival, but the prognosis is still guarded.
- Allo-SCT offers the best chance of cure, but it carries its own risks.

Important Notes:
- This is a complex case requiring a multidisciplinary approach. Close monitoring of MRD response to BFM-HR1 and dasatinib is crucial.
- Early referral to a specialized transplant center is recommended to discuss allo-SCT options.
- Thoroughly discuss the risks and benefits of each treatment option with the patient and family.

Please remember: This is just a recommendation based on the information provided. I cannot provide medical advice. The final treatment decision should be made in consultation with the patient's healthcare team."""

generation_config = {
    "max_output_tokens": 8192,
    "temperature": 1.4,
    "top_p": 0.95,
}

safety_settings = [
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
]

def generate_medical_case():
    model = GenerativeModel(
        "gemini-1.5-flash-002",
        system_instruction=[textsi_1]
    )
    responses = model.generate_content(
        ["""generate a random medical case"""],
        generation_config=generation_config,
        safety_settings=safety_settings,
        stream=True,
    )

    generated_case = ""
    for response in responses:
        generated_case += response.text

    return generated_case

@functions_framework.http
def generate_medical_case_http(request):
    """HTTP Cloud Function."""
    # Configure CORS
    cors = CORS(
        origins=[
            "http://localhost:3000",
            "https://medical-assistant-934163632848.us-central1.run.app"
        ],
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        supports_credentials=True,
        max_age=3600
    )
    
    # Handle preflight request
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": request.headers.get("Origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600"
        }
        return ("", 204, headers)

    # Apply CORS to the main request
    headers = {
        "Access-Control-Allow-Origin": request.headers.get("Origin", "*"),
        "Access-Control-Allow-Credentials": "true"
    }

    try:
        medical_case = generate_medical_case()
        return (jsonify({'medical_case': medical_case}), 200, headers)
    except Exception as e:
        return (jsonify({'error': str(e)}), 500, headers)

if __name__ == "__main__":
    print(generate_medical_case())
