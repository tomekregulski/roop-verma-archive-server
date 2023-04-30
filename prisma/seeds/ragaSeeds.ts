import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding raga DB...');

const ragas = [
  {
    name: 'Abheri',
    alternateSpelling: 'Avhiri',
    time: 'Dusk',
    rasa: 'Devotion (Bhakti)',
  },
  {
    name: 'Abhogi',
    alternateSpelling: 'Abhogi Kanada,',
    time: 'Evening',
    rasa: 'Heroic (Vira)Peace (Shanti)',
  },
  {
    name: 'Adana',
    alternateSpelling: 'Ardana, Addana',
    time: 'Late Evening',
    rasa: 'Heroic (Vira)Humorous (Hasya)',
  },
  {
    name: 'Adbhut Todi',
    time: 'Late Morning',
    rasa: 'Wonder (Adbhuta)',
  },
  {
    name: 'Adi Bhairav',
    time: 'Early Morning',
  },
  {
    name: 'Aheri Todi',
    alternateSpelling: 'Ahiri Todi',
    time: 'Morning',
  },
  {
    name: 'Ahir Bhairav',
    alternateSpelling: 'Ahir Bhairo',
    time: 'Dawn',
    rasa: 'Devotion (Bhakti)Detachment (Tyaga)Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Ahir Lalit',
    time: 'Early Morning, Morning',
    rasa: 'Pathos (Karuna)Devotion (Bhakti)Peace (Shanti)Detachment (Tyaga)',
  },
  {
    name: 'Ahiri Bhatiyar',
  },
  {
    name: 'Ahiri Todi',
    time: 'Morning',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Alam Bhairav',
    alternateSpelling: 'Alam Malaya ShmitiAlam Malaya, Alam Bhairo',
    time: 'Morning',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Alam Kauns',
  },
  {
    name: 'Alam Malaya',
    alternateSpelling: 'Alam Malaya ShmritiAlamBhairo,',
    time: 'Morning',
  },
  {
    name: 'Alamgiri',
  },
  {
    name: 'Alhaiya',
    alternateSpelling: 'Alhaiya Bilawal, Alhaiya Bilawal',
    time: 'Morning',
    rasa: 'Joy (Shringara)Pathos (Karuna)Waiting (Intezari)',
  },
  {
    name: 'Anand Bhairav',
    alternateSpelling: 'Ananda Bhairo',
    time: 'Morning',
    rasa: 'Devotion (Bhakti)Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Anandi',
    time: 'Evening',
    rasa: 'Devotion (Bhakti)Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Anandi Kalyan',
    time: 'Evening',
  },
  {
    name: 'Anjani Todi',
    time: 'Late Morning',
  },
  {
    name: 'Aroon Malhar',
    alternateSpelling: 'Arun Malhar',
    time: 'Evening',
  },
  {
    name: 'Asawari',
    time: 'Morning',
    rasa: 'Detachment (Tyaga)Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Asha Mand',
    alternateSpelling: 'Asa Mand',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Badahans Sarang',
    alternateSpelling: 'Badahamsa Sarang, Barahangs Sarang (AAK)',
    time: 'Early Afternoon, Mid-afternoon',
  },
  {
    name: 'Bagesri',
    alternateSpelling: 'Bageswari, Bageshwari',
    time: 'Late Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Bagesri Bahar',
    time: 'Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)Devotion (Bhakti)',
  },
  {
    name: 'Bagesri Kanada',
    alternateSpelling: 'Bageswari Kanada, Bageshwari',
    time: 'Late Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Devotion (Bhakti)',
  },
  {
    name: 'Bagkauns',
    time: 'Night',
  },
  {
    name: 'Bahaduri Todi',
    time: 'Late Morning',
  },
  {
    name: 'Bahar',
    time: 'Late Evening',
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
    alternateSpelling: 'Bangal Bhairo',
    time: 'Morning',
  },
  {
    name: 'Bangal Bilawal',
  },
  {
    name: 'Baruwa',
    time: 'Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Basant',
    time: 'Middle of Night',
    rasa: 'Heroic (Vira)',
  },
  {
    name: 'Basant Kedar',
    time: 'Night',
  },
  {
    name: 'Basant Mukhari',
    time: 'Morning',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Basant Pancham',
  },
  {
    name: 'Bhairav',
    alternateSpelling: 'Bhairo',
    time: 'Dawn',
    rasa: 'Serious (gambir)Peace (Shanti)Joy (Shringara)Pathos (Karuna)Wonder (Adbhuta)Devotion (Bhakti)Humorous (Hasya)Heroic (Vira)',
  },
  {
    name: 'Bhairavi',
    alternateSpelling: 'Suddha Bhairavi',
    time: 'Morning, Early Morning',
  },
  {
    name: 'Bhairavi Bhatiyar',
  },
  {
    name: 'Bhajans without Raga',
  },
  {
    name: 'Bhakar',
    alternateSpelling: 'Bhankar',
    time: 'Morning',
  },
  {
    name: 'Bhankar Bhatiyari',
  },
  {
    name: 'Bhatiyar',
    alternateSpelling: 'Bhatiyari,',
    time: 'Early Morning',
    rasa: 'Devotion (Bhakti)Heroic (Vira)',
  },
  {
    name: 'Bhavani',
    alternateSpelling: 'Bhawani',
    time: 'Evening',
  },
  {
    name: 'Bhim',
    time: 'Late Afternoon',
  },
  {
    name: 'Bhimpalasri',
    alternateSpelling: 'Bhimpalashri',
    time: 'Late Afternoon',
    rasa: 'Pathos (Karuna)',
  },
  {
    name: 'Bhoghi Baruwa',
    time: 'Evening',
  },
  {
    name: 'Bhup Bilawali',
  },
  {
    name: 'Bhup Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Detachment (Tyaga)Joy (Shringara)',
  },
  {
    name: 'Bhup Mand',
  },
  {
    name: 'Bhupal Todi',
    alternateSpelling: 'Bhupali Todi, Bhupal,',
    time: 'Morning',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Bhupali',
    time: 'Evening',
    rasa: 'Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Bihag',
    time: 'Night',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Bihangada',
    alternateSpelling: 'Bihagra',
    time: 'Evening',
  },
  {
    name: 'Bihari',
    time: 'Night',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Bilas Todi',
    time: 'Late Morning',
  },
  {
    name: 'Bilaskhani Todi',
    alternateSpelling: 'Bilaskhani,',
    time: 'Morning',
    rasa: 'Pathos (Karuna)Devotion (Bhakti)',
  },
  {
    name: 'Bilawal',
    time: 'Morning',
  },
  {
    name: 'Bilawali',
  },
  {
    name: 'Bilawali Durga',
    time: 'Evening',
  },
  {
    name: 'Brihannat',
  },
  {
    name: 'Brindabani Sarang',
    alternateSpelling: 'Brindabani,',
    time: 'Early Afternoon, Mid-afternoon',
  },
  {
    name: 'Champak',
    time: 'Evening',
  },
  {
    name: 'Chanchalsas Malhar',
    alternateSpelling: 'Chanchalsas Ki Malhar,',
  },
  {
    name: 'Chandni Kedara',
    alternateSpelling: 'Chandini Kedar',
    time: 'Late Evening',
  },
  {
    name: 'Chandra Dhani',
    time: 'Evening',
  },
  {
    name: 'Chandra Mohini',
  },
  {
    name: 'Chandra Mukhi',
    time: 'Evening',
  },
  {
    name: 'Chandrakant',
    alternateSpelling: 'Chandrakant Kalyan,',
    time: 'Evening',
  },
  {
    name: 'Chandrakauns',
    time: 'Late Night, Middle of Night',
    rasa: 'Devotion (Bhakti)Heroic (Vira)Peace (Shanti)',
  },
  {
    name: 'Chandrakaunsi',
  },
  {
    name: 'Chandrakaunsi Kanada',
    alternateSpelling: 'Chandrakaunsi Kanara',
  },
  {
    name: 'Chandranandan',
    time: 'Midnight',
    rasa: '"Krishna and gopis-playing ihe moon"Devotion (Bhakti)Heroic (Vira)Joy (Shringara)Pathos (Karuna)Peace (Shanti)',
  },
  {
    name: 'Chandrika',
  },
  {
    name: 'Charanashree',
    alternateSpelling: 'Charanashri',
    time: 'Evening',
    rasa: 'Devotion (Bhakti)Pathos (Karuna)',
  },
  {
    name: 'Charukeshi',
    time: 'Morning, Evening',
  },
  {
    name: 'Chatur Kalyan',
    time: 'Evening',
  },
  {
    name: 'Chaurang Kalyan',
    time: 'Evening',
  },
  {
    name: 'Chhaya',
    alternateSpelling: 'Chaya',
  },
  {
    name: 'Chhaya Kamodi Kalyan',
  },
  {
    name: 'Chhaya Tilak',
    alternateSpelling: 'Chaya Tilak',
    time: 'Evening',
  },
  {
    name: 'Chhayanat',
    alternateSpelling: 'Chayanat',
    time: 'Evening',
    rasa: 'Devotion (Bhakti)Peace (Shanti)Joy (Shringara)',
  },
  {
    name: 'Chitra Gauri',
    alternateSpelling: 'Chitra Gouri',
  },
  {
    name: 'Darbari Kanada',
    alternateSpelling: 'Darbari, Kanara Prakaar, Darbari Kanara',
    time: 'Late Evening',
  },
  {
    name: 'Darbari Todi',
    time: 'Morning',
    rasa: 'Pathos (Karuna)Devotion (Bhakti)',
  },
  {
    name: 'Deen Todi',
    alternateSpelling: 'Ahiri Todi, Bageshree Todi,Hira Todi,',
    time: 'Morning',
  },
  {
    name: 'Desh',
    time: 'Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)Peace (Shanti)',
  },
  {
    name: 'Desh Malhar',
    time: 'Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Desi Todi',
    alternateSpelling: 'Desi , Deshi',
    time: 'Late Morning',
  },
  {
    name: 'Deskar',
    alternateSpelling: 'Deshkar',
    time: 'Late Morning',
    rasa: 'Joy (Shringara)',
  },
  {
    name: 'Devgandhar',
    alternateSpelling: "Duigandhar-(2 ga's),",
    time: 'Late Morning, Early Afternoon',
    rasa: 'Joy (Shringara)Heroic (Vira)',
  },
  {
    name: 'Devgiri Bilawal',
    alternateSpelling: 'Devgiri,',
    time: 'Late Morning',
  },
  {
    name: 'Devranjani',
  },
  {
    name: 'Devsakh',
    alternateSpelling: 'Devsaga, Devsag',
    time: 'Late Morning, Early Afternoon',
  },
  {
    name: 'Dhanasri',
    alternateSpelling: 'Dhanashri',
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
    name: 'Dhawalashri',
    alternateSpelling: 'Dhawalasri',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Dhuliya Malhar',
    alternateSpelling: 'Dhulia Malhar',
  },
  {
    name: 'Dhun',
    time: 'Evening',
  },
  {
    name: 'Dhup Chhao',
  },
  {
    name: 'Durga Bhawani',
    alternateSpelling: 'Durga Bhavani',
  },
  {
    name: 'Durga in Bilawal That',
    alternateSpelling: 'Durga,',
    time: 'Evening',
  },
  {
    name: 'Durga in Khammaj That',
    alternateSpelling: 'Durga,',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Durga Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Durga Khammaj',
    time: 'Evening',
  },
  {
    name: 'Durge Malhar',
  },
  {
    name: 'Durgeswari',
    alternateSpelling: 'Durgeshwari',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Ferozkhani Todi',
  },
  {
    name: 'Gandhari',
    alternateSpelling: 'Gandhar',
    time: 'Late Morning',
  },
  {
    name: 'Gandhari Todi',
    alternateSpelling: 'Jaunpuri\r\n, Gandhar Todi',
    time: 'Late Morning',
  },
  {
    name: 'Gara',
    time: 'Evening',
  },
  {
    name: 'Gara Kanada',
    alternateSpelling: 'Gara Kanara',
    time: 'Night',
  },
  {
    name: 'Gara Pilu',
  },
  {
    name: 'Garant Bahar',
  },
  {
    name: 'Gaud Malhar',
    alternateSpelling: 'Gaur Malhar',
  },
  {
    name: 'Gaud Sarang',
    alternateSpelling: 'Dinka Bihag\r\n, Gaur Sarang',
    time: 'Early Afternoon',
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
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Gopi Ka Basant',
    alternateSpelling: 'Gopika Basant',
    time: 'Morning',
  },
  {
    name: 'Gorokh Kalyan',
    alternateSpelling: 'Gorak Kalyan, Gorakh Kalyan',
    time: 'Late Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)Detachment (Tyaga)',
  },
  {
    name: 'Gunji Kanada',
    alternateSpelling: 'Gunji Kanara',
    time: 'Night',
  },
  {
    name: 'Gunkali',
    alternateSpelling: 'Guna Kali',
    time: 'Early Morning',
  },
  {
    name: 'Gurjari Todi',
    alternateSpelling: 'Gurjari, Gujari Todi',
    time: 'Morning',
    rasa: 'Heroic (Vira)',
  },
  {
    name: 'Hambir',
    alternateSpelling: 'Hamir, Hamvir',
    time: 'Evening',
  },
  {
    name: 'Hansadwani',
    alternateSpelling: 'Hamsadhwani, Hangsadhwani',
    time: 'Evening',
    rasa: 'Heroic (Vira)Joy (Shringara)',
  },
  {
    name: 'Hansakankani',
    alternateSpelling: 'Hansakinkini',
    time: 'Early Afternoon',
  },
  {
    name: 'Hem',
    time: 'Evening',
  },
  {
    name: 'Hem Bihag',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Peace (Shanti)Joy (Shringara)Devotion (Bhakti)Loneliness',
  },
  {
    name: 'Hem Kalyan',
    rasa: 'Devotion (Bhakti)Heroic (Vira)',
  },
  {
    name: 'Hem Lalit',
  },
  {
    name: 'Hemant',
    time: 'Evening, Night',
    rasa: 'Devotion (Bhakti)Joy (Shringara)Pathos (Karuna)Peace (Shanti)Loneliness',
  },
  {
    name: 'Hemant Bahar',
  },
  {
    name: 'Hindol',
    time: 'Evening',
    rasa: 'Heroic (Vira)Devotion (Bhakti)Detachment (Tyaga)',
  },
  {
    name: 'Hindol Bahar',
  },
  {
    name: 'Hindol Gauri',
  },
  {
    name: 'Hindol Hem',
    time: 'Evening, Night',
    rasa: 'Pathos (Karuna)Heroic (Vira)Peace (Shanti)',
  },
  {
    name: 'Hindol Kalyan',
    time: 'Evening, Late Night',
  },
  {
    name: 'Hindol Pancham',
  },
  {
    name: 'Hindoli',
  },
  {
    name: 'Husseini Kanada',
    alternateSpelling: 'Husseni Kanara',
  },
  {
    name: 'Jait',
    alternateSpelling: 'Jayata,',
  },
  {
    name: 'Jait Kalyan',
    alternateSpelling: 'Jayath Kalyan, Jayati Kalyan',
    time: 'Evening',
  },
  {
    name: 'Jaitasri',
    alternateSpelling: 'Jaitsri',
  },
  {
    name: 'Jaladar Kedar',
    alternateSpelling: 'Jhaldhar Kedara',
    time: 'Late Night',
  },
  {
    name: 'Jangla Pilu',
    time: 'Evening',
  },
  {
    name: 'Jaunpuri',
    alternateSpelling: 'Jaunpuri Todi,',
    time: 'Morning',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Jayasri',
    time: 'Early Evening',
    rasa: 'Detachment (Tyaga)Pathos (Karuna)',
  },
  {
    name: 'Jayjaywanti',
    alternateSpelling: 'Jaijaiwanti',
    time: 'Late Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Jhinjhat',
    rasa: 'Peace (Shanti)Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Jhinjhat Manj',
  },
  {
    name: 'Jhinjhoti',
    time: 'Late Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Jog',
    time: 'Late Night',
    rasa: 'Pathos (Karuna)Joy (Shringara)Heroic (Vira)',
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
    alternateSpelling: 'Jogia Kalingra',
    time: 'Early Morning',
    rasa: 'Pathos (Karuna)Joy (Shringara)Devotion (Bhakti)',
  },
  {
    name: 'Kafi',
    time: 'Afternoon',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Kafi Bagesri',
  },
  {
    name: 'Kafi Kanada',
    alternateSpelling: 'Kafi Kanara',
  },
  {
    name: 'Kafi Todi',
    time: 'Early Afternoon',
  },
  {
    name: 'Kalavati',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Kamod',
    time: 'Evening',
    rasa: 'Peace (Shanti)',
  },
  {
    name: 'Kapi',
  },
  {
    name: 'Kaunshik Dhani',
    alternateSpelling: 'Dhani Kaush, Koshik Dhani',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Devotion (Bhakti)Joy (Shringara)',
  },
  {
    name: 'Kaunsi Bhairav',
    alternateSpelling: 'Kaunsi Bhairo',
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
    alternateSpelling: 'Kaunsi Kanara',
    time: 'Late Evening',
  },
  {
    name: 'Kaunsi Sindh',
  },
  {
    name: 'Kaunsiki Bhairavi',
    alternateSpelling: 'Kaunsi Ki Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Kaunsiki Todi',
    alternateSpelling: 'Kaunsi ki Todi',
  },
  {
    name: 'Kedara',
    alternateSpelling: 'Kedar, Kedar',
    time: 'Night',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Khambavati',
    alternateSpelling: 'Khambawati',
    time: 'Midnight',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Khambawati Kanada',
    alternateSpelling: 'Khambavati Kanara',
    time: 'Midnight',
  },
  {
    name: 'Khammaj',
    time: 'Late Night',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Khammaji',
  },
  {
    name: 'Khammaji Hindol',
  },
  {
    name: 'Khammaji Kanada',
    alternateSpelling: 'Khammaji Kanara',
  },
  {
    name: 'Khat',
    time: 'Late Morning',
  },
  {
    name: 'Khat Todi',
  },
  {
    name: 'Kirtan',
    alternateSpelling: 'Bengali Mand, Folk Tune',
  },
  {
    name: 'Kirwani',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Kohal Kanada',
    alternateSpelling: 'Kohal Kanara',
  },
  {
    name: 'Komal Asawari',
    time: 'Morning',
  },
  {
    name: 'Kukubh Bilawal',
    time: 'Morning',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Lachari Todi',
    time: 'Early Afternoon, Late Morning',
    rasa: 'happiness',
  },
  {
    name: 'Lachhasag',
    time: 'Early Afternoon, Late Morning',
  },
  {
    name: 'Lajwanti',
    time: 'Evening',
  },
  {
    name: 'Lakshmi Ki Bhairavi',
    alternateSpelling: 'Laxshmi Ki Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Lakshmi Todi',
    alternateSpelling: 'Laxshmi Todi',
    time: 'Morning',
  },
  {
    name: 'Lalit',
    time: 'Pre-dawn',
    rasa: 'Heroic (Vira)Pathos (Karuna)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Lalit Pancham',
    time: 'Dawn',
  },
  {
    name: 'Lalita Bhatiyari',
    alternateSpelling: 'Lalit Bhatiyar',
  },
  {
    name: 'Lalita Gauri',
    time: 'Early Evening',
  },
  {
    name: 'Lankadahan Sarang',
    alternateSpelling: 'Lankadhan Saran, Lankadahan',
    time: 'Mid-afternoon',
  },
  {
    name: 'Latungi',
  },
  {
    name: 'Lom',
    alternateSpelling: 'Loom',
    time: 'Any time but early morning',
  },
  {
    name: 'Lom Bilawal',
  },
  {
    name: 'Lom Mand',
    alternateSpelling: 'Loom Mand',
  },
  {
    name: 'Lom Manj',
    alternateSpelling: 'Lome Manj',
  },
  {
    name: 'Lom Narayani',
    time: 'Evening',
  },
  {
    name: 'Lom Shyam',
  },
  {
    name: 'Ma Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Madan Manjari',
  },
  {
    name: 'Madan Manjari Malhar',
    time: 'Evening',
  },
  {
    name: 'Madhu Malavi',
  },
  {
    name: 'Madhukauns',
    time: 'Late Night',
  },
  {
    name: 'Madhumad Sarang',
    alternateSpelling: 'Madhumat Sarang',
    time: 'Early Afternoon',
  },
  {
    name: 'Madhumalati',
    time: 'Evening',
    rasa: 'Detachment (Tyaga)Devotion (Bhakti)Humorous (Hasya)Heroic (Vira)Joy (Shringara)Pathos (Karuna)Peace (Shanti)',
  },
  {
    name: 'Madhumalavi Kanada',
    alternateSpelling: 'Madhumalavi Kanara',
  },
  {
    name: 'Madhuwanti',
    alternateSpelling: 'Madhuvanti',
    time: 'Late Afternoon',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Madhyam Se Gara',
  },
  {
    name: 'Malasri',
    time: 'Evening',
    rasa: 'Joy (Shringara)Heroic (Vira)',
  },
  {
    name: 'Malaya Giri',
    time: 'Evening',
  },
  {
    name: 'Malgunji',
    time: 'Evening',
  },
  {
    name: 'Malhar',
    time: 'Middle of Night',
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
    time: 'Late Night, Middle of Night',
    rasa: 'Heroic (Vira)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Maluha Chandini Kedar',
    alternateSpelling: 'Malinichand Kedara,',
  },
  {
    name: 'Maluha Gaur Malhar',
  },
  {
    name: 'Maluha Kalyan',
  },
  {
    name: 'Maluha Kedar',
    alternateSpelling: 'Maluha Kedara',
    time: 'Evening',
  },
  {
    name: 'Maluha Lom',
  },
  {
    name: 'Mand',
    time: 'Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)Peace (Shanti)',
  },
  {
    name: 'Mangal Bhairav',
    alternateSpelling: 'Mangal Bhairo',
    time: 'Morning',
  },
  {
    name: 'Mangali Kala',
  },
  {
    name: 'Manj',
  },
  {
    name: 'Manj Khammaj',
    time: 'Night',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Manj Mand',
  },
  {
    name: 'Manjari',
  },
  {
    name: 'Manomani Sarang',
    time: 'Early Afternoon',
  },
  {
    name: 'Maru Bihag',
    time: 'Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Maru Hindol',
    alternateSpelling: 'Maru Hindola,',
  },
  {
    name: 'Marwa',
    time: 'Late Evening',
    rasa: 'Detachment (Tyaga)Heroic (Vira)Devotion (Bhakti)Peace (Shanti)Pathos (Karuna)',
  },
  {
    name: 'Mata Bhawani',
    alternateSpelling: 'Mata Bhavani',
  },
  {
    name: 'Medhabi',
    alternateSpelling: 'Medhavi',
    time: 'Evening',
  },
  {
    name: 'Megh Malhar',
    alternateSpelling: 'Megh',
    rasa: 'Heroic (Vira)Devotion (Bhakti)',
  },
  {
    name: 'Megh Sarang',
    rasa: 'Peace (Shanti)Heroic (Vira)',
  },
  {
    name: 'Meghranjani',
    time: 'Early Morning, Late Night',
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
    rasa: 'Pathos (Karuna)Peace (Shanti)',
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
    time: 'Late Afternoon, Early Evening',
    rasa: 'Joy (Shringara)Pathos (Karuna)Peace (Shanti)',
  },
  {
    name: 'Misra Todi',
  },
  {
    name: 'Miyan Ki Malhar',
    alternateSpelling: 'Miyan Malhar, Mian ki Malhar, Miyanh ki Malhaar',
    time: 'Evening, or anytime in rainy season but morning',
    rasa: 'Pathos (Karuna)Heroic (Vira)Joy (Shringara)',
  },
  {
    name: 'Miyan Ki Sarang',
    alternateSpelling: 'Mian Ki Sarang',
    time: 'Early Afternoon, Mid-afternoon',
    rasa: 'Devotion (Bhakti)Pathos (Karuna)',
  },
  {
    name: 'Miyan Ki Todi',
    alternateSpelling: 'Mian Ki Todi',
    time: 'Morning',
  },
  {
    name: 'Mriga Manjari',
  },
  {
    name: 'Mudra Ki Todi',
  },
  {
    name: 'Mudriki Kanada',
    alternateSpelling: 'Mudra Ki Kanara',
    time: 'Evening',
  },
  {
    name: 'Multani',
    time: 'Late Afternoon',
    rasa: 'Pathos (Karuna)"Pathos of birds and animals-they are playing all day in sun-then when the sun is going down they are alitle sad that dark is coming and they have no home to go to"Pathos (Karuna)',
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
    time: 'Evening, Early Evening',
  },
  {
    name: 'Narayani Gauri',
  },
  {
    name: 'Narayani Kalyan',
  },
  {
    name: 'Nat',
    time: 'Evening',
  },
  {
    name: 'Nat Bhairav',
    alternateSpelling: 'Nat Bhairo',
    time: 'Dawn, Early Morning',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Nat Bihag',
    time: 'Evening',
  },
  {
    name: 'Nat Bilawal',
    alternateSpelling: 'Nat Bilawali,',
    time: 'Late Morning',
  },
  {
    name: 'Nat Kuranjika',
    time: 'Middle of Night',
  },
  {
    name: 'Nat Lom',
    alternateSpelling: 'Nat Loom, Nat Lome',
  },
  {
    name: 'Nat Malhar',
  },
  {
    name: 'Nat Narayani Bhairav',
    alternateSpelling: 'Nat Narayani Bhairo',
    time: 'Morning',
  },
  {
    name: 'Nata Bhairavi',
  },
  {
    name: 'Natchari Todi',
    time: 'Morning',
  },
  {
    name: 'Nayaki Kanada',
    alternateSpelling: 'Nayaki Kanara',
    time: 'Late Evening',
  },
  {
    name: 'New Maihar Band I',
    rasa: 'Other',
  },
  {
    name: 'Pahadi',
    alternateSpelling: 'Pahari, Pohadi',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Pahadi Jhinjhoti',
    alternateSpelling: 'Pahari Jhinjhoti',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Palas Kafi',
    alternateSpelling: 'Palash Kafi',
    time: 'Afternoon',
  },
  {
    name: 'Palasi',
    alternateSpelling: 'Palash, Palas',
    time: 'Afternoon',
  },
  {
    name: 'Pancham',
    time: 'Middle of Night',
  },
  {
    name: 'Paraj',
    time: 'Late Night',
    rasa: 'Heroic (Vira)Pathos (Karuna)',
  },
  {
    name: 'Parvat Bhairav',
    alternateSpelling: 'Prabhat Bhairo, Parvat Bhairo',
  },
  {
    name: 'Pat Bihag',
    alternateSpelling: 'Pata Bihag',
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
    alternateSpelling: 'Patdeep',
    time: 'Late Afternoon',
  },
  {
    name: 'Pilu',
    time: 'Evening, Late Afternoon',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
  },
  {
    name: 'Pilu Baruwa',
    time: 'Afternoon, Evening, Night',
  },
  {
    name: 'Prabhakali',
    alternateSpelling: 'Jogi, Prava Kali',
  },
  {
    name: 'Prabhatashwari',
    time: 'Morning',
  },
  {
    name: 'Prabhati',
  },
  {
    name: 'Prabhati Sarang',
  },
  {
    name: 'Pradipaki',
    alternateSpelling: 'Pradipki, Pradeepaki, Patdipaki',
  },
  {
    name: 'Prahava Bhatiyar',
    time: 'Morning',
  },
  {
    name: 'Puriya',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Heroic (Vira)Devotion (Bhakti)Detachment (Tyaga)',
  },
  {
    name: 'Puriya Dhanasri',
    alternateSpelling: 'Puriya Dhanashri',
    time: 'Early Evening',
    rasa: 'Pathos (Karuna)Peace (Shanti)Joy (Shringara)Devotion (Bhakti)Heroic (Vira)',
  },
  {
    name: 'Puriya Kalyan',
    alternateSpelling: 'Purva Kalyan, Purab Kalyan, Purav Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Peace (Shanti)Joy (Shringara)Devotion (Bhakti)',
  },
  {
    name: 'Purvi',
    alternateSpelling: 'Purbi',
    time: 'Early Evening',
    rasa: 'Devotion (Bhakti)Peace (Shanti)',
  },
  {
    name: 'Purvi Kalyan',
    alternateSpelling: 'Purbi Kalyan',
    time: 'Dusk',
    rasa: 'Devotion (Bhakti)Pathos (Karuna)Peace (Shanti)',
  },
  {
    name: 'Rag Sagar',
  },
  {
    name: 'Ragesri',
    alternateSpelling: 'Rageshri, Rageshwari',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Rajesri',
    alternateSpelling: 'Rajeshri',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Ramdasi Malhar',
    time: 'Night',
  },
  {
    name: 'Ramkali',
    time: 'Early Morning',
    rasa: 'Devotion (Bhakti)Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Ranjani',
  },
  {
    name: 'Rasaranjani',
    alternateSpelling: 'Rasa Ranjani',
  },
  {
    name: 'Rupmanjari Malhar',
    alternateSpelling: 'Roop Manjari Malhar',
    time: 'Late Evening',
  },
  {
    name: 'Sahana',
    time: 'Midnight',
  },
  {
    name: 'Sahana Kanada',
    alternateSpelling: 'Sahana Kanara',
  },
  {
    name: 'Sajhgiri',
    alternateSpelling: 'Sadjagiri',
    time: 'Midnight',
    rasa: 'Detachment (Tyaga)Pathos (Karuna)',
  },
  {
    name: 'Samanta Sarang',
    time: 'Afternoon',
  },
  {
    name: 'Sarang Megh',
  },
  {
    name: 'Saraswati',
    time: 'Evening',
  },
  {
    name: 'Sarfarda Bilawal',
    alternateSpelling: 'Sarfarda,',
    time: 'Morning',
  },
  {
    name: 'Savani Kalyan',
    alternateSpelling: 'Sayani Kalyan',
    time: 'Evening',
  },
  {
    name: 'Shankara',
    alternateSpelling: 'Shankara Ragini,',
    time: 'Late Evening',
    rasa: 'Devotion (Bhakti)Heroic (Vira)',
  },
  {
    name: 'Shankara Bharan',
  },
  {
    name: 'Shankara Karan',
    alternateSpelling: 'Karan Shankara',
  },
  {
    name: 'Shivamat Bhairav',
    alternateSpelling: 'Shivamat Bhairo, Shiva Bhairav',
    time: 'Morning',
  },
  {
    name: 'Shivaranjani',
    time: 'Late Afternoon',
    rasa: 'Joy (Shringara)Pathos (Karuna)Devotion (Bhakti)Detachment (Tyaga)Peace (Shanti)',
  },
  {
    name: 'Shobhavati',
    time: 'Evening',
  },
  {
    name: 'Shyam Kalyan',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Sindhu Bhairavi',
    alternateSpelling: 'Sindh Bhairavi, Sindhi Bhairavi',
    time: 'Morning',
    rasa: 'Peace (Shanti)Pathos (Karuna)Joy (Shringara)Devotion (Bhakti)',
  },
  {
    name: 'Sindhu Todi',
    time: 'Morning',
  },
  {
    name: 'Sindhura',
    time: 'Late Afternoon, Early Evening',
  },
  {
    name: 'Sindhura Kafi',
    time: 'Evening',
  },
  {
    name: 'Sohan Basant',
  },
  {
    name: 'Sohini',
    time: 'Midnight',
    rasa: 'Heroic (Vira)Joy (Shringara)Chanchal (Restless)',
  },
  {
    name: 'Sorat',
    alternateSpelling: 'Surat',
    time: 'Evening',
    rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Sowrastra Tunka Bhairo',
    time: 'Morning',
  },
  {
    name: 'Sree Rag',
    alternateSpelling: 'Shree, Shri, Sri',
    time: 'Sunset',
    rasa: 'Devotion (Bhakti)Heroic (Vira)Pathos (Karuna)',
  },
  {
    name: 'Subhavati',
    time: 'Late Evening',
  },
  {
    name: 'Suddh Bhairavi',
    alternateSpelling: 'Shuddh Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Suddh Kalyan',
    alternateSpelling: 'Shuddh Kalyan',
    time: 'Evening',
    rasa: 'Peace (Shanti)Devotion (Bhakti)',
  },
  {
    name: 'Suddh Sarang',
    alternateSpelling: 'Shuddh Sarang',
    time: 'Early Afternoon',
  },
  {
    name: 'Suddh Todi',
    alternateSpelling: 'Shuddh Todi',
    time: 'Morning',
  },
  {
    name: 'Sughrai',
    time: 'Afternoon, Night',
  },
  {
    name: 'Suha Kanada',
    alternateSpelling: 'Suha Kanara',
    time: 'Afternoon, Night',
  },
  {
    name: 'Suha Sughrai',
  },
  {
    name: 'Suha Todi',
    time: 'Late Morning, Early Afternoon',
  },
  {
    name: 'Sukla Bilawal',
    time: 'Morning',
  },
  {
    name: 'Surdasi Malhar',
    alternateSpelling: 'Surdas Ki Malhar, Surmalhar',
    time: 'Night',
    rasa: 'Heroic (Vira)',
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
    rasa: 'Joy (Shringara)Pathos (Karuna)',
  },
  {
    name: 'Todi',
    time: 'Morning',
    rasa: 'Devotion (Bhakti)Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Todi Bhairavi',
    time: 'Morning',
  },
  {
    name: 'Un-named Ragas',
  },
  {
    name: 'Vachaspati',
    time: 'Evening',
  },
  {
    name: 'Vibhas',
    alternateSpelling: 'Bibhas',
    time: 'Late Morning',
    rasa: 'Devotion (Bhakti)Heroic (Vira)',
  },
  {
    name: 'Yaman',
    alternateSpelling: 'Yeman, Iman, Yemen',
    time: 'Night',
  },
  {
    name: 'Yaman Kalyan',
    alternateSpelling: 'Yeman Kalyan, Iman Kalyan, Yemen Kalyan',
    time: 'Evening',
    rasa: 'Devotion (Bhakti)Peace (Shanti)Pathos (Karuna)Joy (Shringara)',
  },
  {
    name: 'Yamni',
    alternateSpelling: 'Imni',
  },
  {
    name: 'Yamni Bilawal',
    alternateSpelling: 'Yaman Bilawal, Imni Bilawal',
    time: 'Morning',
  },
  {
    name: 'Zilla',
    alternateSpelling: 'Zila',
    time: 'Evening',
  },
  {
    name: 'Zilla Kafi',
    time: 'Afternoon, Evening',
  },
  {
    name: 'Zillaf',
    time: 'Morning',
  },
  {
    name: 'Tabla Solo',
  },
  {
    name: 'Bhup Hemant',
  },
  {
    name: 'Mantra Chanting',
  },
  {
    name: 'Unknown',
  },
  {
    name: 'No Raga Listed',
  },
  {
    name: 'Megh',
  },
  {
    name: 'New Raga',
  },
];

async function main() {
  ragas.forEach(async (raga) => {
    await prisma.raga.create({
      data: raga,
    });
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
