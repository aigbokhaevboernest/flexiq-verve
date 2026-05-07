const PRIORITY = [
  "United States","United Kingdom","Canada","Australia","Germany","France","Japan","China",
  "India","Brazil","Mexico","South Korea","Italy","Spain","Netherlands","Switzerland",
  "Sweden","Norway","Singapore","United Arab Emirates",
];

const REST_RAW = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize",
  "Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Central African Republic","Chad","Chile","Colombia",
  "Comoros","Congo (Brazzaville)","Congo (Kinshasa)","Costa Rica","Croatia","Cuba","Cyprus","Czechia",
  "Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador",
  "Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","Gabon","Gambia",
  "Georgia","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti",
  "Honduras","Hungary","Iceland","Indonesia","Iran","Iraq","Ireland","Israel","Ivory Coast",
  "Jamaica","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia",
  "Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar",
  "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nauru","Nepal","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Sudan","Sri Lanka","Sudan","Suriname","Syria","Taiwan","Tajikistan",
  "Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const priSet = new Set(PRIORITY);
const REST = REST_RAW.filter((c) => !priSet.has(c)).sort((a, b) => a.localeCompare(b));

export const countries: string[] = [...PRIORITY, ...REST];
