const { Raga } = require('../models');

const ragaData = [
  {
    name: 'Abheri',
    alternate_spelling_b: 'Avhiri',
    light: 'Dusk',
    rasa: 'Devotion (Bhakti)',
  },
  {
    name: 'Abhogi',
    alternate_spelling_a: 'Abhogi Kanada',
    time: 'Evening',
    rasa: 'Heroic (Vira)\r\nPeace (Shanti)',
  },
  {
    name: 'Adana',
    alternate_spelling_b: 'Ardana, Addana',
    time: 'Late Evening',
    rasa: 'Heroic (Vira)\r\nHumorous (Hasya)',
  },
  {
    name: 'Adbhut Todi',
    time: 'Late Morning',
    rasa: 'Wonder (Adbhuta)',
  },
  {
    name: 'Aheri Todi',
    alternate_spelling_b: 'Ahiri Todi',
    time: 'Morning',
  },
  {
    name: 'Ahir Bhairav',
    alternate_spelling_b: 'Ahir Bhairo',
    time: 'Early Morning',
    light: 'Dawn',
    rasa: 'Devotion (Bhakti)\r\nDetachment (Tyaga)\r\nJoy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Ahir Lalit',
    time: 'Early Morning\r\nMorning',
    rasa: 'Pathos (Karuna)\r\nDevotion (Bhakti)\r\nPeace (Shanti)\r\nDetachment (Tyaga)',
  },
  {
    name: 'Ahiri Bhatiyar',
  },
  {
    name: 'Alam Bhairav',
    alternate_spelling_a: 'Alam Malaya Shmiti/Alam Malaya',
    alternate_spelling_b: 'Alam Bhairo',
    time: 'Morning',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Alam Kauns',
  },
  {
    name: 'Alam Malaya',
    alternate_spelling_a: 'Alam Malaya ShmritiAlamBhairo',
    time: 'Morning\r\nLate Morning',
  },
  {
    name: 'Alamgiri',
    time: 'Morning\r\nEvening\r\nLate Morning\r\nNoon\r\nEarly Afternoon\r\nMid-afternoon\r\nLate Afternoon\r\nEarly Evening\r\nLate Evening',
  },
  {
    name: 'Alhaiya',
    alternate_spelling_a: 'Alhaiya Bilawal',
    alternate_spelling_b: 'Alhaiya Bilawal',
    time: 'Morning\r\nLate Morning',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)\r\nWaiting (Intezari)',
  },
  {
    name: 'Anand Bhairav',
    alternate_spelling_b: 'Ananda Bhairo',
    time: 'Morning',
    rasa: 'Devotion (Bhakti)\r\nPathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Anandi',
    time: 'Evening',
    rasa: 'Devotion (Bhakti)\r\nPathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Anandi Kalyan',
  },
  {
    name: 'Anjani Todi',
    time: 'Late Morning',
  },
  {
    name: 'Asawari',
    time: 'Morning\r\nLate Morning',
    rasa: 'Detachment (Tyaga)\r\nPathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Asha Mand',
    alternate_spelling_b: 'Asa Mand',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Badahans Sarang',
    alternate_spelling_b: 'Badahamsa Sarang, Barahangs Sarang (AAK)',
    time: 'Early Afternoon\r\nMid-afternoon',
  },
  {
    name: 'Bagesri',
    alternate_spelling_a: 'Bageswari',
    time: 'Evening\r\nLate Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Bagesri Bahar',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Bagesri Kanada',
    alternate_spelling_a: 'Bageswari Kanada',
    time: 'Evening\r\nLate Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Bagkauns',
    time: 'Night\r\nLate Evening',
  },
  {
    name: 'Bahaduri Todi',
    time: 'Late Morning',
  },
  {
    name: 'Bahar',
    time: 'Evening\r\nLate Evening',
  },
  {
    name: 'Bahar Anta Jog',
  },
  {
    name: 'Bairagi',
    time: 'Morning',
  },
  {
    name: 'Bangal Bhairav',
    alternate_spelling_b: 'Bangal Bhairo',
    time: 'Morning',
  },
  {
    name: 'Bangal Bilawal',
  },
  {
    name: 'Baruwa',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Basant',
    time: 'Middle of Night\r\nLate Night',
    rasa: 'Heroic (Vira)',
  },
  {
    name: 'Basant Kedar',
    time: 'Evening\r\nLate Evening\r\nNight',
  },
  {
    name: 'Basant Mukhari',
    time: 'Morning',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Basant Pancham',
  },
  {
    name: 'Bhairav',
    alternate_spelling_b: 'Bhairo',
    time: 'Early Morning',
    light: 'Dawn',
    rasa: 'Serious (gambir)\r\nPeace (Shanti)\r\nJoy (Shringara)\r\nPathos (Karuna)\r\nWonder (Adbhuta)\r\nDevotion (Bhakti)\r\nHumorous (Hasya)\r\nHeroic (Vira)',
  },
  {
    name: 'Bhairavi',
    alternate_spelling_b: 'Suddha Bhairavi',
    time: 'Morning\r\nEarly Morning',
  },
  {
    name: 'Bhairavi Bhatiyar',
  },
  {
    name: 'Bhakar',
    alternate_spelling_b: 'Bhankar',
    time: 'Morning',
  },
  {
    name: 'Bhatiyar',
    alternate_spelling_a: 'Bhatiyari',
    time: 'Early Morning\r\nMorning',
    rasa: 'Devotion (Bhakti)\r\nHeroic (Vira)',
  },
  {
    name: 'Bhavani',
    alternate_spelling_b: 'Bhawani',
    time: 'Evening',
  },
  {
    name: 'Bhim',
    time: 'Late Afternoon',
  },
  {
    name: 'Bhimpalasri',
    alternate_spelling_b: 'Bhimpalashri',
    time: 'Late Afternoon',
    rasa: 'Pathos (Karuna)',
  },
  {
    name: 'Bhoghi Baruwa',
    time: 'Evening',
  },
  {
    name: 'Bhup Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nDetachment (Tyaga)\r\nJoy (Shringara)',
  },
  {
    name: 'Bhup Mand',
  },
  {
    name: 'Bhupal Todi',
    alternate_spelling_a: 'Bhupali Todi, Bhupal',
    time: 'Morning',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Bhupali',
    time: 'Evening',
    rasa: 'Peace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Bihag',
    time: 'Night\r\nMiddle of Night\r\nLate Night\r\nLate Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Bihangada',
    alternate_spelling_b: 'Bihagra',
    time: 'Evening',
  },
  {
    name: 'Bihari',
    time: 'Evening\r\nLate Evening\r\nNight',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Bilaskhani Todi',
    alternate_spelling_a: 'Bilaskhani',
    time: 'Morning',
    rasa: 'Pathos (Karuna)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Bilawal',
  },
  {
    name: 'Brihannat',
  },
  {
    name: 'Brindabani Sarang',
    alternate_spelling_a: 'Brindabani',
    time: 'Early Afternoon\r\nMid-afternoon\r\nNoon',
  },
  {
    name: 'Champak',
    time: 'Evening',
  },
  {
    name: 'Chanchalsas Malhar',
    alternate_spelling_a: 'Chanchalsas Ki Malhar',
  },
  {
    name: 'Chandni Kedara',
    alternate_spelling_b: 'Chandini Kedar',
    time: 'Evening\r\nLate Evening\r\n7-10 pm',
  },
  {
    name: 'Chandra Dhani',
    time: 'Evening',
  },
  {
    name: 'Chandra Mohini',
  },
  {
    name: 'Chandrakant',
    alternate_spelling_a: 'Chandrakant Kalyan',
    time: 'Evening',
  },
  {
    name: 'Chandrakauns',
    time: 'Night\r\nMiddle of Night\r\nLate Night\r\n9 or 10pm till 2 or 3am',
    rasa: 'Devotion (Bhakti)\r\nHeroic (Vira)\r\nPeace (Shanti)',
  },
  {
    name: 'Chandrakaunsi Kanada',
    alternate_spelling_b: 'Chandrakaunsi Kanara',
  },
  {
    name: 'Chandranandan',
    time: 'Evening\r\nNight\r\nMiddle of Night\r\nLate Night\r\nFULL MOON\r\nLate Evening',
    light: '"Midnight"',
    rasa: '"Krishna and gopis-playing ihe moon"\r\nDevotion (Bhakti)\r\nHeroic (Vira)\r\nJoy (Shringara)\r\nPathos (Karuna)\r\nPeace (Shanti)',
  },
  {
    name: 'Chandrika',
  },
  {
    name: 'Chatur Kalyan',
    time: 'Evening',
  },
  {
    name: 'Chhaya',
    alternate_spelling_b: 'Chaya',
  },
  {
    name: 'Chhaya Tilak',
    alternate_spelling_b: 'Chaya Tilak',
  },
  {
    name: 'Chhayanat',
    alternate_spelling_b: 'Chayanat',
    time: 'Evening',
    rasa: 'Devotion (Bhakti)\r\nPeace (Shanti)\r\nJoy (Shringara)',
  },
  {
    name: 'Chitra Gauri',
    alternate_spelling_b: 'Chitra Gouri',
  },
  {
    name: 'Darbari Kanada',
    alternate_spelling_a: 'Darbari, Kanara Prakaar',
    alternate_spelling_b: 'Darbari Kanara',
    time: 'Late Evening',
  },
  {
    name: 'Darbari Todi',
    time: 'Morning',
    rasa: 'Pathos (Karuna)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Desh',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)\r\nPeace (Shanti)',
  },
  {
    name: 'Desh Malhar',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Desi Todi',
    alternate_spelling_a: 'Desi',
    time: 'Late Morning',
  },
  {
    name: 'Deskar',
    alternate_spelling_b: 'Deshkar',
    time: 'Late Morning',
    rasa: 'Joy (Shringara)',
  },
  {
    name: 'Devgandhar',
    alternate_spelling_a: 'Duigandhar-(2 gaÔøΩs)',
    time: 'Late Morning\r\nEarly Afternoon',
    rasa: 'Joy (Shringara)\r\nHeroic (Vira)',
  },
  {
    name: 'Devgiri Bilawal',
    alternate_spelling_a: 'Devgiri',
    time: 'Late Morning',
  },
  {
    name: 'Devranjani',
  },
  {
    name: 'Devsakh',
    alternate_spelling_a: 'Devsaga',
    alternate_spelling_b: 'Devsag',
    time: 'Late Morning\r\nEarly Afternoon\r\nNoon',
  },
  {
    name: 'Dhanasri',
    alternate_spelling_b: 'Dhanashri',
    time: 'Evening',
  },
  {
    name: 'Dhani',
    time: 'Late Afternoon',
  },
  {
    name: 'Dhankauns',
  },
  {
    name: 'Dharmawati',
  },
  {
    name: 'Dhuliya Malhar',
    alternate_spelling_b: 'Dhulia Malhar',
  },
  {
    name: 'Durga Bhawani',
    alternate_spelling_b: 'Durga Bhavani',
  },
  {
    name: 'Durga in Bilawal That',
    alternate_spelling_a: 'Durga',
    time: 'Evening',
  },
  {
    name: 'Durga in Khammaj That',
    alternate_spelling_a: 'Durga',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Durga Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Durga Khammaj',
    time: 'Evening',
  },
  {
    name: 'Durgeswari',
    alternate_spelling_b: 'Durgeshwari',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Ferozkhani Todi',
  },
  {
    name: 'Gandhari',
    alternate_spelling_b: 'Gandhar',
    time: 'Late Morning',
  },
  {
    name: 'Gandhari Todi',
    alternate_spelling_a: 'Jaunpuri',
    alternate_spelling_b: 'Gandhar Todi',
    time: 'Sometimes after 12 noon\r\nLate Morning',
  },
  {
    name: 'Gara',
    time: 'Evening',
  },
  {
    name: 'Gara Kanada',
    alternate_spelling_b: 'Gara Kanara',
    time: 'midnight\r\nNight',
  },
  {
    name: 'Gara Pilu',
  },
  {
    name: 'Garant Bahar',
  },
  {
    name: 'Gaud Malhar',
    alternate_spelling_b: 'Gaur Malhar',
  },
  {
    name: 'Gaud Sarang',
    alternate_spelling_a: 'Dinka Bihag',
    alternate_spelling_b: 'Gaur Sarang',
    time: 'Noon\r\nEarly Afternoon\r\n12 - 3 pm',
  },
  {
    name: 'Gauri',
  },
  {
    name: 'Gauri Manjari',
    time: 'Evening',
    rasa: 'Chamatkar',
  },
  {
    name: 'Gauri Shankara',
  },
  {
    name: 'Gawati',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Gopi Ka Basant',
    alternate_spelling_b: 'Gopika Basant',
    time: 'Morning',
  },
  {
    name: 'Gorokh Kalyan',
    alternate_spelling_b: 'Gorak Kalyan, Gorakh Kalyan',
    time: 'Evening\r\nLate Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)\r\nDetachment (Tyaga)',
  },
  {
    name: 'Gunkali',
    alternate_spelling_b: 'Guna Kali',
    time: 'Early Morning',
  },
  {
    name: 'Gurjari Todi',
    alternate_spelling_a: 'Gurjari',
    alternate_spelling_b: 'Gujari Todi',
    time: 'Morning',
    rasa: 'Heroic (Vira)',
  },
  {
    name: 'Hambir',
    alternate_spelling_b: 'Hamir, Hamvir',
    time: 'Evening',
  },
  {
    name: 'Hansadwani',
    alternate_spelling_b: 'Hamsadhwani, Hangsadhwani',
    time: 'Evening',
    rasa: 'Heroic (Vira)\r\nJoy (Shringara)',
  },
  {
    name: 'Hansakankani',
    alternate_spelling_b: 'Hansakinkini',
    time: 'Early Afternoon',
  },
  {
    name: 'Hem',
    time: 'Evening',
  },
  {
    name: 'Hem Bihag',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nPeace (Shanti)\r\nJoy (Shringara)\r\nDevotion (Bhakti)\r\nLoneliness',
  },
  {
    name: 'Hem Kalyan',
    rasa: 'Devotion (Bhakti)\r\nHeroic (Vira)',
  },
  {
    name: 'Hemant',
    rasa: 'Devotion (Bhakti)\r\nJoy (Shringara)\r\nPathos (Karuna)\r\nPeace (Shanti)\r\nLoneliness',
  },
  {
    name: 'Hemant Bahar',
  },
  {
    name: 'Hindol',
    time: 'Evening',
    rasa: 'Heroic (Vira)\r\nDevotion (Bhakti)\r\nDetachment (Tyaga)',
  },
  {
    name: 'Hindol Bahar',
  },
  {
    name: 'Hindol Hem',
    rasa: 'Pathos (Karuna)\r\nHeroic (Vira)\r\nPeace (Shanti)',
  },
  {
    name: 'Hindol Pancham',
  },
  {
    name: 'Husseini Kanada',
    alternate_spelling_b: 'Husseni Kanara',
  },
  {
    name: 'Jait',
    alternate_spelling_a: 'Jayata',
  },
  {
    name: 'Jait Kalyan',
    alternate_spelling_b: 'Jayath Kalyan, Jayati Kalyan',
    time: 'Evening',
  },
  {
    name: 'Jaitasri',
    alternate_spelling_b: 'Jaitsri',
  },
  {
    name: 'Jaladar Kedar',
    alternate_spelling_b: 'Jhaldhar Kedara',
    time: 'Late Night\r\nEvening',
  },
  {
    name: 'Jangla Pilu',
    time: 'Evening',
  },
  {
    name: 'Jaunpuri',
    alternate_spelling_a: 'Jaunpuri Todi',
    time: 'Morning\r\nLate Morning',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Jayasri',
    time: 'Early Evening',
    rasa: 'Detachment (Tyaga)\r\nPathos (Karuna)',
  },
  {
    name: 'Jayjaywanti',
    alternate_spelling_b: 'Jaijaiwanti',
    time: 'Late Evening\r\nNight',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Jhinjhat',
    rasa: 'Peace (Shanti)\r\nPathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Jhinjhat Manj',
  },
  {
    name: 'Jhinjhoti',
    time: 'Late Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Jog',
    time: 'Late Evening\r\nNight\r\nMiddle of Night',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nHeroic (Vira)',
  },
  {
    name: 'Jog Kaunsi',
  },
  {
    name: 'Jogi',
  },
  {
    name: 'Jogiya',
    time: 'Early Morning',
  },
  {
    name: 'Jogiya Kalengra',
    alternate_spelling_b: 'Jogia Kalingra',
    time: 'Early Morning',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Kafi',
    time: 'Evening\r\nLate Afternoon\r\nMid-afternoon',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Kafi Bagesri',
  },
  {
    name: 'Kafi Kanada',
    alternate_spelling_b: 'Kafi Kanara',
  },
  {
    name: 'Kalavati',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Kamod',
    time: 'Evening',
    rasa: 'Peace (Shanti)',
  },
  {
    name: 'Kaunshik Dhani',
    alternate_spelling_a: 'Dhani Kaush',
    alternate_spelling_b: 'Koshik Dhani',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nDevotion (Bhakti)\r\nJoy (Shringara)',
  },
  {
    name: 'Kaunsi Bhairav',
    alternate_spelling_b: 'Kaunsi Bhairo',
    time: 'Morning',
  },
  {
    name: 'Kaunsi Bhairavi',
  },
  {
    name: 'Kaunsi Jogiya',
  },
  {
    name: 'Kaunsi Kanada',
    alternate_spelling_b: 'Kaunsi Kanara',
    time: 'Night\r\nLate Evening',
  },
  {
    name: 'Kaunsiki Bhairavi',
    alternate_spelling_b: 'Kaunsi Ki Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Kedara',
    alternate_spelling_a: 'Kedar',
    alternate_spelling_b: 'Kedar',
    time: 'Night',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Khambavati',
    alternate_spelling_b: 'Khambawati',
    time: 'Night\r\nMiddle of Night\r\nLate Night',
    light: '"Midnight"',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Khambawati Kanada',
    alternate_spelling_b: 'Khambavati Kanara',
    time: 'Night\r\nMiddle of Night\r\nLate Night\r\nEvening\r\nLate Evening',
    light: '"Midnight"',
  },
  {
    name: 'Khammaj',
    time: 'Late Night',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Khammaji Hindol',
  },
  {
    name: 'Khammaji Kanada',
    alternate_spelling_b: 'Khammaji Kanara',
  },
  {
    name: 'Khat',
    time: 'Late Morning',
  },
  {
    name: 'Khat Todi',
  },
  {
    name: 'Kirwani',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Kohal Kanada',
    alternate_spelling_b: 'Kohal Kanara',
  },
  {
    name: 'Komal Asawari',
    time: 'Morning\r\nLate Morning',
  },
  {
    name: 'Kukubh Bilawal',
    alternate_spelling_b: 'Morning',
    light: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Lachari Todi',
    time: 'Morning\r\nEarly Afternoon\r\nLate Morning',
    rasa: 'happiness',
  },
  {
    name: 'Lachhasag',
    time: 'Early Afternoon\r\nLate Morning',
  },
  {
    name: 'Lajwanti',
    time: 'Evening',
  },
  {
    name: 'Lakshmi Ki Bhairavi',
    alternate_spelling_b: 'Laxshmi Ki Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Lakshmi Todi',
    alternate_spelling_b: 'Laxshmi Todi',
    time: 'Morning\r\nLate Morning',
  },
  {
    name: 'Lalit',
    time: 'Early Morning\r\nright before it gets light, before Jogiya',
    light: 'Dawn\r\nPre-dawn\r\nFirst Sunrays',
    rasa: 'Heroic (Vira)\r\nPathos (Karuna)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Lalit Pancham',
    time: 'Early Morning',
    light: 'Dawn',
  },
  {
    name: 'Lalita Gauri',
    time: '"After Sreerag"',
  },
  {
    name: 'Lankadahan Sarang',
    alternate_spelling_b: 'Lankadhan Saran, Lankadahan',
    time: 'Mid-afternoon',
  },
  {
    name: 'Lom',
    alternate_spelling_b: 'Loom',
    time: 'Any time but early morning\r\nLate Morning\r\nNoon\r\nEarly Afternoon\r\nMid-afternoon\r\nLate Afternoon\r\nEarly Evening\r\nEvening\r\nLate Evening\r\nNight\r\nMiddle of Night\r\nLate Night',
  },
  {
    name: 'Lom Bilawal',
  },
  {
    name: 'Ma Bhairavi',
  },
  {
    name: 'Madan Manjari',
  },
  {
    name: 'Madhu Malavi',
  },
  {
    name: 'Madhumad Sarang',
    alternate_spelling_b: 'Madhumat Sarang',
    time: 'Noon\r\nEarly Afternoon',
  },
  {
    name: 'Madhumalati',
    time: 'Evening',
    rasa: 'Detachment (Tyaga)\r\nDevotion (Bhakti)\r\nHumorous (Hasya)\r\nHeroic (Vira)\r\nJoy (Shringara)\r\nPathos (Karuna)\r\nPeace (Shanti)',
  },
  {
    name: 'Madhumalavi Kanada',
    alternate_spelling_b: 'Madhumalavi Kanara',
  },
  {
    name: 'Madhuwanti',
    alternate_spelling_b: 'Madhuvanti',
    time: 'Late Afternoon\r\n4 - 9 pm\r\nEvening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Madhyam Se Gara',
  },
  {
    name: 'Malasri',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nHeroic (Vira)',
  },
  {
    name: 'Malgunji',
    time: 'Evening',
  },
  {
    name: 'Malhar',
    time: 'Middle of Night\r\nLate Night',
  },
  {
    name: 'Maligaura',
    time: 'Evening',
  },
  {
    name: 'Malika',
  },
  {
    name: 'Malkauns',
    time: 'Night\r\nMiddle of Night\r\nLate Night',
    rasa: 'Heroic (Vira)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Maluha Chandini Kedar',
    alternate_spelling_a: 'Malinichand Kedara',
  },
  {
    name: 'Maluha Kalyan',
  },
  {
    name: 'Maluha Kedar',
    alternate_spelling_b: 'Maluha Kedara',
    time: 'Evening',
  },
  {
    name: 'Mand',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)\r\nPeace (Shanti)',
  },
  {
    name: 'Mangal Bhairav',
    alternate_spelling_b: 'Mangal Bhairo',
    time: 'Morning',
  },
  {
    name: 'Manj',
  },
  {
    name: 'Manj Khammaj',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Manj Mand',
  },
  {
    name: 'Manomani Sarang',
    time: 'Early Afternoon',
  },
  {
    name: 'Maru Bihag',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Maru Hindol',
    alternate_spelling_a: 'Maru Hindola',
  },
  {
    name: 'Marwa',
    time: 'Evening\r\nLate Evening',
    light:
      'Detachment (Tyaga)\r\nHeroic (Vira)\r\nDevotion (Bhakti)\r\nPeace (Shanti)\r\nPathos (Karuna)',
  },
  {
    name: 'Mata Bhawani',
    alternate_spelling_b: 'Mata Bhavani',
  },
  {
    name: 'Medhabi',
    alternate_spelling_b: 'Medhavi',
    time: 'Evening',
  },
  {
    name: 'Megh Malhar',
    alternate_spelling_b: 'Megh',
    rasa: 'Heroic (Vira)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Megh Sarang',
    rasa: 'Peace (Shanti)\r\nHeroic (Vira)',
  },
  {
    name: 'Meghranjani',
    time: 'Early Morning\r\nLate Night',
  },
  {
    name: 'Misra Gara',
  },
  {
    name: 'Misra Jhinjhoti',
  },
  {
    name: 'Misra Kafi',
  },
  {
    name: 'Misra Khammaj',
  },
  {
    name: 'Misra Kirwani',
    rasa: 'Pathos (Karuna)\r\nPeace (Shanti)',
  },
  {
    name: 'Misra Mand',
    time: 'Evening',
  },
  {
    name: 'Misra Pilu',
  },
  {
    name: 'Misra Shivaranjani',
    time: 'Late Afternoon\r\nEarly Evening',
    light: 'Joy (Shringara)\r\nPathos (Karuna)\r\nPeace (Shanti)',
  },
  {
    name: 'Miyan Ki Malhar',
    alternate_spelling_a: 'Miyan Malhar',
    alternate_spelling_b: 'Mian ki Malhar, Miyanh ki Malhaar',
    time: 'Evening-in rainy season-anytime but morning',
    light: 'Pathos (Karuna)\r\nHeroic (Vira)\r\nJoy (Shringara)',
  },
  {
    name: 'Miyan Ki Sarang',
    alternate_spelling_b: 'Mian Ki Sarang',
    time: 'Early Afternoon\r\nMid-afternoon',
    light: 'Devotion (Bhakti)\r\nPathos (Karuna)',
  },
  {
    name: 'Miyan Ki Todi',
    alternate_spelling_b: 'Mian Ki Todi',
    time: 'Morning',
  },
  {
    name: 'Mriga Manjari',
  },
  {
    name: 'Mudriki Kanada',
    alternate_spelling_b: 'Mudra Ki Kanara',
    time: 'Evening',
  },
  {
    name: 'Multani',
    time: 'Late Afternoon',
    light:
      'Pathos (Karuna)"Pathos of birds and animals-they are playing all day in sun-then when the sun is going down they are alitle sad that dark is coming and they have no home to go to"\r\nPathos (Karuna)',
  },
  {
    name: 'Nand',
    time: 'Evening',
  },
  {
    name: 'Nandini',
  },
  {
    name: 'Narayanasri',
    time: 'Early Evening',
  },
  {
    name: 'Narayani',
    time: 'Evening\r\nEarly Evening',
  },
  {
    name: 'Narayani Gauri',
  },
  {
    name: 'Nat',
    time: 'Evening',
  },
  {
    name: 'Nat Bhairav',
    alternate_spelling_b: 'Nat Bhairo',
    time: 'Early Morning',
    light: 'Dawn',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Nat Bihag',
    time: 'Evening',
  },
  {
    name: 'Nat Bilawal',
    alternate_spelling_a: 'Nat Bilawali',
    time: 'Late Morning',
  },
  {
    name: 'Nat Kuranjika',
    time: 'Night\r\nMiddle of Night',
  },
  {
    name: 'Nat Lom',
    alternate_spelling_b: 'Nat Loom, Nat Lome',
  },
  {
    name: 'Nat Malhar',
  },
  {
    name: 'Nat Narayani Bhairav',
    alternate_spelling_b: 'Nat Narayani Bhairo',
    time: 'Morning',
  },
  {
    name: 'Nayaki Kanada',
    alternate_spelling_b: 'Nayaki Kanara',
    time: 'Night\r\nLate Evening',
  },
  {
    name: 'Pahadi',
    alternate_spelling_b: 'Pahari, Pohadi',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Pahadi Jhinjhoti',
    alternate_spelling_b: 'Pahari Jhinjhoti',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Palas Kafi',
    alternate_spelling_b: 'Palash Kafi',
  },
  {
    name: 'Palasi',
    alternate_spelling_a: 'Palash',
    alternate_spelling_b: 'Palas',
    time: 'Late Afternoon\r\nMid-afternoon',
  },
  {
    name: 'Pancham',
    time: 'Middle of Night\r\nNight',
  },
  {
    name: 'Paraj',
    time: 'Late Night',
    rasa: 'Heroic (Vira)\r\nPathos (Karuna)',
  },
  {
    name: 'Parvat Bhairav',
    alternate_spelling_b: 'Prabhat Bhairo, Parvat Bhairo',
  },
  {
    name: 'Pat Bihag',
    alternate_spelling_b: 'Pata Bihag',
    time: 'Evening',
  },
  {
    name: 'Patamanjari',
  },
  {
    name: 'Pataranjani',
  },
  {
    name: 'Patdip',
    alternate_spelling_b: 'Patdeep',
    time: 'Late Afternoon',
  },
  {
    name: 'Pilu',
    time: 'Evening\r\nLate Afternoon',
    light: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)',
  },
  {
    name: 'Pilu Baruwa',
  },
  {
    name: 'Prabhakali',
    alternate_spelling_a: 'Jogi',
    alternate_spelling_b: 'Prava Kali',
  },
  {
    name: 'Prabhatashwari',
    time: 'Morning',
  },
  {
    name: 'Prabhati Sarang',
  },
  {
    name: 'Pradipaki',
    alternate_spelling_a: 'Pradipki',
    alternate_spelling_b: 'Pradeepaki, Patdipaki',
  },
  {
    name: 'Puriya',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nHeroic (Vira)\r\nDevotion (Bhakti)\r\nDetachment (Tyaga)',
  },
  {
    name: 'Puriya Dhanasri',
    alternate_spelling_b: 'Puriya Dhanashri',
    time: 'Early Evening',
    light: 'First Candle',
    rasa: 'Pathos (Karuna)\r\nPeace (Shanti)\r\nJoy (Shringara)\r\nDevotion (Bhakti)\r\nHeroic (Vira)',
  },
  {
    name: 'Puriya Kalyan',
    alternate_spelling_b: 'Purva Kalyan, Purab Kalyan, Purav Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nPeace (Shanti)\r\nJoy (Shringara)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Purvi',
    alternate_spelling_b: 'Purbi',
    time: 'Early Evening',
    light: 'First Candle',
    rasa: 'Devotion (Bhakti)\r\nPeace (Shanti)',
  },
  {
    name: 'Purvi Kalyan',
    alternate_spelling_b: 'Purbi Kalyan',
    time: 'Early Evening\r\nAfter Sunset',
    light: 'Dusk',
    rasa: 'Devotion (Bhakti)\r\nPathos (Karuna)\r\nPeace (Shanti)',
  },
  {
    name: 'Ragesri',
    alternate_spelling_b: 'Rageshri, Rageshwari',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Rajesri',
    alternate_spelling_b: 'Rajeshri',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Ramdasi Malhar',
  },
  {
    name: 'Ramkali',
    time: 'Early Morning\r\nMorning\r\n7-11 AM',
    rasa: 'Devotion (Bhakti)\r\nPathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Ranjani',
  },
  {
    name: 'Rasaranjani',
    alternate_spelling_b: 'Rasa Ranjani',
  },
  {
    name: 'Rupmanjari Malhar',
    alternate_spelling_b: 'Roop Manjari Malhar',
    time: 'Evening\r\nLate Evening',
  },
  {
    name: 'Sahana',
    light: '"Midnight"',
  },
  {
    name: 'Sahana Kanada',
    alternate_spelling_b: 'Sahana Kanara',
  },
  {
    name: 'Sajhgiri',
    alternate_spelling_b: 'Sadjagiri',
    time: 'Late Night',
    light: '"Midnight"',
    rasa: 'Detachment (Tyaga)\r\nPathos (Karuna)',
  },
  {
    name: 'Samanta Sarang',
    time: 'Afternoon',
  },
  {
    name: 'Sarang Megh',
  },
  {
    name: 'Sarfarda Bilawal',
    alternate_spelling_a: 'Sarfarda',
    time: 'Morning',
  },
  {
    name: 'Savani Kalyan',
    alternate_spelling_b: 'Sayani Kalyan',
    time: 'Evening',
  },
  {
    name: 'Shankara',
    alternate_spelling_a: 'Shankara Ragini',
    time: 'Late Evening\r\nEvening',
    light: 'Devotion (Bhakti)\r\nHeroic (Vira)',
  },
  {
    name: 'Shankara Bharan',
  },
  {
    name: 'Shankara Karan',
    alternate_spelling_b: 'Karan Shankara',
  },
  {
    name: 'Shivamat Bhairav',
    alternate_spelling_b: 'Shivamat Bhairo, Shiva Bhairav',
    time: 'Morning',
  },
  {
    name: 'Shivaranjani',
    time: 'Evening\r\nLate Afternoon\r\nEarly Afternoon',
    light:
      'Joy (Shringara)\r\nPathos (Karuna)\r\nDevotion (Bhakti)\r\nDetachment (Tyaga)\r\nPeace (Shanti)',
  },
  {
    name: 'Shobhavati',
    time: 'Evening',
  },
  {
    name: 'Shyam Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Sindhu Bhairavi',
    alternate_spelling_b: 'Sindh Bhairavi, Sindhi Bhairavi',
    time: 'Morning or at the end of a concert\r\nMorning',
    light:
      'Peace (Shanti)\r\nPathos (Karuna)\r\nJoy (Shringara)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Sindhura',
    time: 'Late Afternoon\r\nEarly Evening',
  },
  {
    name: 'Sohan Basant',
  },
  {
    name: 'Sohini',
    time: 'Night\r\nMiddle of Night\r\n12am-4am \r\nthe third stage of night',
    light: '"Midnight"',
    rasa: 'Heroic (Vira)\r\nJoy (Shringara)\r\nChanchal (Restless)',
  },
  {
    name: 'Sorat',
    alternate_spelling_b: 'Surat',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)\r\nPeace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Sree Rag',
    alternate_spelling_b: 'Shree, Shri, Sri',
    time: 'Early Evening',
    light: 'Sunset',
    rasa: 'Devotion (Bhakti)\r\nHeroic (Vira)\r\nPathos (Karuna)',
  },
  {
    name: 'Subhavati',
    time: 'Evening\r\nLate Evening',
  },
  {
    name: 'Suddh Bhairavi',
    alternate_spelling_b: 'Shuddh Bhairavi',
  },
  {
    name: 'Suddh Kalyan',
    alternate_spelling_b: 'Shuddh Kalyan',
    time: 'Evening',
    rasa: 'Peace (Shanti)\r\nDevotion (Bhakti)',
  },
  {
    name: 'Suddh Sarang',
    alternate_spelling_b: 'Shuddh Sarang',
    time: 'Early Afternoon',
  },
  {
    name: 'Sughrai',
    time: 'Noon\r\nEarly Afternoon\r\nMid-afternoon\r\nLate Afternoon\r\nEarly Evening\r\nEvening\r\nLate Evening\r\nNight',
  },
  {
    name: 'Suha Kanada',
    alternate_spelling_b: 'Suha Kanara',
    time: 'Noon\r\nNight',
  },
  {
    name: 'Suha Sughrai',
  },
  {
    name: 'Suha Todi',
    time: 'Late Morning\r\nEarly Afternoon',
  },
  {
    name: 'Sukla Bilawal',
    time: 'Morning',
  },
  {
    name: 'Surdasi Malhar',
    alternate_spelling_a: 'Surdas Ki Malhar',
    alternate_spelling_b: 'Surmalhar',
    time: 'Evening\r\nNight\r\nLate Evening',
    light: 'Heroic (Vira)',
  },
  {
    name: 'Tilak Bihari',
  },
  {
    name: 'Tilak Kamod',
    time: 'Evening',
    rasa: 'Joy (Shringara)',
  },
  {
    name: 'Tilang',
    time: 'Evening',
    rasa: 'Joy (Shringara)\r\nPathos (Karuna)',
  },
  {
    name: 'Todi',
    time: 'Morning\r\nLate Morning',
    light: 'Devotion (Bhakti)\r\nPathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Vachaspati',
    time: 'Evening',
  },
  {
    name: 'Vibhas',
    alternate_spelling_b: 'Bibhas',
    time: 'Late Morning',
    light: 'Devotion (Bhakti)\r\nHeroic (Vira)',
  },
  {
    name: 'Yaman',
    alternate_spelling_b: 'Yeman, Iman, Yemen',
  },
  {
    name: 'Yaman Kalyan',
    alternate_spelling_b: 'Yeman Kalyan, Iman Kalyan, Yemen Kalyan',
    time: '6pmÔøΩ9pm\r\nAfter Sunset\r\nEvening',
    light:
      'Devotion (Bhakti)\r\nPeace (Shanti)\r\nPathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Yamni',
    alternate_spelling_b: 'Imni',
  },
  {
    name: 'Yamni Bilawal',
    alternate_spelling_a: 'Yaman Bilawal',
    alternate_spelling_b: 'Imni Bilawal',
  },
  {
    name: 'Zilla',
    alternate_spelling_b: 'Zila',
    time: 'Evening',
  },
  {
    name: 'Zilla Kafi',
    time: 'Early Afternoon\r\nMid-afternoon\r\nLate Afternoon\r\nEarly Evening\r\nEvening\r\nAfternoon till 10pm',
  },
  {
    name: 'Charukeshi',
    time: 'Morning\r\nEvening',
  },
  {
    name: 'Dhun',
    time: 'Evening',
  },
  {
    name: 'Bilawali',
  },
  {
    name: 'Sindhura Kafi',
    time: 'Evening',
  },
  {
    name: 'Madan Manjari Malhar',
    time: 'Evening',
  },
  {
    name: 'Saraswati',
    time: 'Evening',
  },
  {
    name: 'Kapi',
  },
  {
    name: 'Hindoli',
  },
  {
    name: 'Ahiri Todi',
    time: 'Morning',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Chaurang Kalyan',
    time: 'Evening',
  },
  {
    name: 'Mudra Ki Todi',
  },
  {
    name: 'Natchari Todi',
    time: 'Morning\r\nLate Morning',
  },
  {
    name: 'Malaya Giri',
    time: 'Evening',
  },
  {
    name: 'Lom Mand',
    alternate_spelling_b: 'Loom Mand',
  },
  {
    name: 'Lom Manj',
    alternate_spelling_b: 'Lome Manj',
  },
  {
    name: 'Dhup Chhao',
  },
  {
    name: 'Hindol Gauri',
  },
  {
    name: 'Lom Shyam',
  },
  {
    name: 'Un-named Ragas',
  },
  {
    name: 'Chandra Mukhi',
    time: 'Evening\r\nAfter 9',
  },
  {
    name: 'Chhaya Kamodi Kalyan',
  },
  {
    name: 'Dhawalashri',
    alternate_spelling_b: 'Dhawalasri',
    time: 'Evening',
    rasa: 'Pathos (Karuna)\r\nJoy (Shringara)',
  },
  {
    name: 'Hem Lalit',
  },
  {
    name: 'New Maihar Band I',
    rasa: 'Other',
  },
  {
    name: 'Bhankar Bhatiyari',
  },
  {
    name: 'Prahava Bhatiyar',
    time: 'Morning',
  },
  {
    name: 'Bilas Todi',
    time: 'Late Morning',
  },
  {
    name: 'Suddh Todi',
    alternate_spelling_b: 'Shuddh Todi',
    time: 'Morning',
  },
  {
    name: 'Kafi Todi',
    time: 'Noon\r\nEarly Afternoon',
  },
  {
    name: 'Deen Todi',
    alternate_spelling_a: 'Ahiri Todi, Bageshree Todi,Hira Todi',
    time: 'Morning',
  },
  {
    name: 'Latungi',
  },
  {
    name: 'Zillaf',
    time: 'Morning',
  },
  {
    name: 'Aroon Malhar',
    alternate_spelling_b: 'Arun Malhar',
    time: 'Evening',
  },
  {
    name: 'Durge Malhar',
  },
  {
    name: 'Maluha Gaur Malhar',
  },
  {
    name: 'Gunji Kanada',
    alternate_spelling_b: 'Gunji Kanara',
  },
  {
    name: 'Sindhu Todi',
    time: 'Morning\r\nLate Morning',
  },
  {
    name: 'Mangali Kala',
  },
  {
    name: 'Nata Bhairavi',
  },
  {
    name: 'Narayani Kalyan',
  },
  {
    name: 'Maluha Lom',
  },
  {
    name: 'Charanashree',
    alternate_spelling_b: 'Charanashri',
    time: 'Evening',
    rasa: 'Devotion (Bhakti)\r\nPathos (Karuna)',
  },
  {
    name: 'Bhajans without Raga',
  },
  {
    name: 'Manjari',
  },
  {
    name: 'Khammaji',
  },
  {
    name: 'Kaunsiki Todi',
    alternate_spelling_b: 'Kaunsi ki Todi',
  },
  {
    name: 'Misra Todi',
  },
  {
    name: 'Bhup Bilawali',
  },
  {
    name: 'Sowrastra Tunka Bhairo',
    time: 'Morning',
  },
  {
    name: 'Lom Narayani',
    time: 'Evening',
  },
  {
    name: 'Rag Sagar',
  },
  {
    name: 'Lalita Bhatiyari',
    alternate_spelling_b: 'Lalit Bhatiyar',
  },
  {
    name: 'Bilawali Durga',
    time: 'Early Morning;\r\n4:30-7:00 AM\r\nEarly Morning',
  },
  {
    name: 'Adi Bhairav',
  },
  {
    name: 'Kirtan',
    alternate_spelling_b: 'Bengali Mand, Folk Tune',
  },
  {
    name: 'Chandrakaunsi',
  },
  {
    name: 'Prabhati',
  },
  {
    name: 'Hindol Kalyan',
    time: 'Night\r\nMiddle of Night\r\nLate Night\r\nEvening\r\nLate Evening',
  },
  {
    name: 'Todi Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Kaunsi Sindh',
  },
  {
    name: 'Madhukauns',
  },
];

const seedRagas = () => Raga.bulkCreate(ragaData);

module.exports = seedRagas;
