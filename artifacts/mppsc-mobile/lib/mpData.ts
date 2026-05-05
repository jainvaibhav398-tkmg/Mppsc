export type FeatureCategory = "river" | "mountain" | "city" | "wildlife" | "dam";

export type Feature = {
  id: string;
  name: string;
  hindi: string;
  category: FeatureCategory;
  lat: number;
  lng: number;
  brief: string;
};

export const MP_FEATURES: Feature[] = [
  { id: "narmada",     name: "Narmada River",      hindi: "नर्मदा नदी",              category: "river",    lat: 22.5,  lng: 76.5,  brief: "MP की जीवन रेखा, अमरकंटक से निकलती है। 1312 km लंबी, पश्चिम की ओर बहती है।" },
  { id: "chambal",     name: "Chambal River",      hindi: "चम्बल नदी",               category: "river",    lat: 25.2,  lng: 77.8,  brief: "यमुना की सहायक नदी, MP-राजस्थान सीमा पर बहती है।" },
  { id: "betwa",       name: "Betwa River",        hindi: "बेतवा नदी",               category: "river",    lat: 24.5,  lng: 78.0,  brief: "यमुना में मिलने वाली MP की प्रमुख नदी, विदिशा से गुजरती है।" },
  { id: "tapti",       name: "Tapti River",        hindi: "ताप्ती नदी",              category: "river",    lat: 21.5,  lng: 76.2,  brief: "पश्चिम की ओर बहने वाली नदी, बेतूल जिले से निकलती है।" },
  { id: "ken",         name: "Ken River",          hindi: "केन नदी",                 category: "river",    lat: 24.8,  lng: 80.0,  brief: "पन्ना से निकलकर यमुना में मिलती है, हीरे की खान क्षेत्र।" },
  { id: "wainganga",   name: "Wainganga River",    hindi: "वैनगंगा नदी",            category: "river",    lat: 21.8,  lng: 80.2,  brief: "गोदावरी की सहायक, MP-महाराष्ट्र सीमा पर बहती है।" },
  { id: "sone",        name: "Son River",          hindi: "सोन नदी",                 category: "river",    lat: 23.0,  lng: 81.0,  brief: "अमरकंटक से निकलकर गंगा में मिलती है। 780 km लंबी।" },
  { id: "johila",      name: "Johila River",       hindi: "जोहिला नदी",              category: "river",    lat: 22.8,  lng: 81.5,  brief: "सोन की सहायक, अमरकंटक से निकलती है।" },
  { id: "vindhya",     name: "Vindhya Range",      hindi: "विंध्याचल",               category: "mountain", lat: 24.5,  lng: 77.5,  brief: "उत्तर MP में फैली पर्वत श्रृंखला, गंगा-नर्मदा जल विभाजन रेखा।" },
  { id: "satpura",     name: "Satpura Range",      hindi: "सतपुड़ा पर्वत",          category: "mountain", lat: 22.5,  lng: 78.5,  brief: "'सात पहाड़' — MP की प्रमुख पर्वत श्रृंखला, मध्य भाग में।" },
  { id: "amarkantak",  name: "Amarkantak",         hindi: "अमरकंटक",                 category: "mountain", lat: 22.67, lng: 81.77, brief: "नर्मदा, सोन और जोहिला तीनों नदियों का उद्गम स्थल।" },
  { id: "pachmarhi",   name: "Pachmarhi",          hindi: "पचमढ़ी",                  category: "mountain", lat: 22.47, lng: 78.43, brief: "MP का एकमात्र हिल स्टेशन, सतपुड़ा में 1067 मी. ऊँचाई।" },
  { id: "dhupgarh",    name: "Dhupgarh Peak",      hindi: "धूपगढ़",                  category: "mountain", lat: 22.48, lng: 78.37, brief: "MP की सबसे ऊँची चोटी — 1352 मीटर, पचमढ़ी के पास।" },
  { id: "bhopal",      name: "Bhopal",             hindi: "भोपाल",                   category: "city",     lat: 23.26, lng: 77.41, brief: "मध्यप्रदेश की राजधानी, झीलों का शहर, 1984 गैस त्रासदी।" },
  { id: "indore",      name: "Indore",             hindi: "इंदौर",                   category: "city",     lat: 22.72, lng: 75.86, brief: "व्यापारिक नगरी, अहिल्याबाई होल्कर की राजधानी, स्वच्छतम शहर।" },
  { id: "gwalior",     name: "Gwalior",            hindi: "ग्वालियर",                category: "city",     lat: 26.22, lng: 78.18, brief: "किला नगरी, सिंधिया राजवंश, संगीत सम्राट तानसेन की जन्मस्थली।" },
  { id: "jabalpur",    name: "Jabalpur",           hindi: "जबलपुर",                  category: "city",     lat: 23.18, lng: 79.99, brief: "संगमरमर नगरी, भेड़ाघाट-धुआंधार जलप्रपात, नर्मदा किनारे।" },
  { id: "ujjain",      name: "Ujjain",             hindi: "उज्जैन",                  category: "city",     lat: 23.18, lng: 75.79, brief: "महाकाल नगरी, सिंहस्थ कुंभ मेला, कर्क रेखा पर स्थित।" },
  { id: "sanchi",      name: "Sanchi",             hindi: "सांची",                   category: "city",     lat: 23.48, lng: 77.74, brief: "UNESCO विश्व धरोहर — बौद्ध स्तूप, रायसेन जिले में।" },
  { id: "khajuraho",   name: "Khajuraho",          hindi: "खजुराहो",                 category: "city",     lat: 24.85, lng: 79.93, brief: "UNESCO विश्व धरोहर — चंदेल राजवंश के मंदिर, छतरपुर।" },
  { id: "orchha",      name: "Orchha",             hindi: "ओरछा",                    category: "city",     lat: 25.35, lng: 78.64, brief: "बुंदेला राजवंश, बेतवा किनारे, टीकमगढ़ जिला।" },
  { id: "kanha",       name: "Kanha NP",           hindi: "कान्हा राष्ट्रीय उद्यान",  category: "wildlife", lat: 22.27, lng: 80.61, brief: "बाघ अभयारण्य, बारासिंघा का एकमात्र घर, मंडला जिला।" },
  { id: "bandhavgarh", name: "Bandhavgarh NP",     hindi: "बांधवगढ़",                 category: "wildlife", lat: 23.72, lng: 81.05, brief: "देश में बाघों का सर्वाधिक घनत्व, उमरिया जिला।" },
  { id: "pench",       name: "Pench NP",           hindi: "पेंच राष्ट्रीय उद्यान",    category: "wildlife", lat: 21.75, lng: 79.27, brief: "मोगली की भूमि, MP-महाराष्ट्र सीमा, सिवनी जिला।" },
  { id: "panna",       name: "Panna NP",           hindi: "पन्ना",                   category: "wildlife", lat: 24.75, lng: 80.0,  brief: "हीरे की खान + बाघ अभयारण्य, केन नदी किनारे।" },
  { id: "satpura_np",  name: "Satpura NP",         hindi: "सतपुड़ा राष्ट्रीय उद्यान", category: "wildlife", lat: 22.5,  lng: 78.2,  brief: "होशंगाबाद, विविध वन्यजीव, तवा नदी किनारे।" },
  { id: "indira_sagar",name: "Indira Sagar Dam",   hindi: "इंदिरा सागर बाँध",        category: "dam",      lat: 22.45, lng: 76.45, brief: "MP का सबसे बड़ा बाँध, खंडवा जिला, नर्मदा नदी पर।" },
  { id: "gandhi_sagar",name: "Gandhi Sagar Dam",   hindi: "गांधी सागर बाँध",         category: "dam",      lat: 24.72, lng: 75.52, brief: "चम्बल नदी पर, राजस्थान सीमा, सबसे पुराना बाँध।" },
  { id: "tawa",        name: "Tawa Dam",           hindi: "तवा बाँध",                category: "dam",      lat: 22.55, lng: 78.22, brief: "होशंगाबाद, तवा नदी पर, नर्मदा की सहायक।" },
  { id: "omkareshwar", name: "Omkareshwar Dam",    hindi: "ओंकारेश्वर बाँध",         category: "dam",      lat: 22.23, lng: 76.14, brief: "ज्योतिर्लिंग के पास, नर्मदा पर, खंडवा जिला।" },
];

export const CATEGORY_CONFIG: Record<FeatureCategory, { label: string; color: string; icon: string }> = {
  river:    { label: "नदियाँ",    color: "#2563eb", icon: "droplet" },
  mountain: { label: "पर्वत",    color: "#7c3aed", icon: "triangle" },
  city:     { label: "नगर",      color: "#d97706", icon: "map-pin" },
  wildlife: { label: "वन्यजीव", color: "#16a34a", icon: "feather" },
  dam:      { label: "बाँध",     color: "#0891b2", icon: "layers" },
};
