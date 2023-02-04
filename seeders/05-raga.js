'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert('Raga', [
      {
        name: 'Abheri',
        alternate_spelling: 'Avhiri',
        time: 'Dusk',
        rasa: 'Devotion (Bhakti)',
      },
      {
        name: 'Abhogi',
        alternate_spelling: 'Abhogi Kanada,',
        time: 'Evening',
        rasa: 'Heroic (Vira)Peace (Shanti)',
      },
      {
        name: 'Adana',
        alternate_spelling: 'Ardana, Addana',
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
        alternate_spelling: 'Ahiri Todi',
        time: 'Morning',
      },
      {
        name: 'Ahir Bhairav',
        alternate_spelling: 'Ahir Bhairo',
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
        alternate_spelling: 'Alam Malaya ShmitiAlam Malaya, Alam Bhairo',
        time: 'Morning',
        rasa: 'Pathos (Karuna)Joy (Shringara)',
      },
      {
        name: 'Alam Kauns',
      },
      {
        name: 'Alam Malaya',
        alternate_spelling: 'Alam Malaya ShmritiAlamBhairo,',
        time: 'Morning',
      },
      {
        name: 'Alamgiri',
      },
      {
        name: 'Alhaiya',
        alternate_spelling: 'Alhaiya Bilawal, Alhaiya Bilawal',
        time: 'Morning',
        rasa: 'Joy (Shringara)Pathos (Karuna)Waiting (Intezari)',
      },
      {
        name: 'Anand Bhairav',
        alternate_spelling: 'Ananda Bhairo',
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
        alternate_spelling: 'Arun Malhar',
        time: 'Evening',
      },
      {
        name: 'Asawari',
        time: 'Morning',
        rasa: 'Detachment (Tyaga)Pathos (Karuna)Joy (Shringara)',
      },
      {
        name: 'Asha Mand',
        alternate_spelling: 'Asa Mand',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
      },
      {
        name: 'Badahans Sarang',
        alternate_spelling: 'Badahamsa Sarang, Barahangs Sarang (AAK)',
        time: 'Early Afternoon, Mid-afternoon',
      },
      {
        name: 'Bagesri',
        alternate_spelling: 'Bageswari, Bageshwari',
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
        alternate_spelling: 'Bageswari Kanada, Bageshwari',
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
        alternate_spelling: 'Bangal Bhairo',
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
        alternate_spelling: 'Bhairo',
        time: 'Dawn',
        rasa: 'Serious (gambir)Peace (Shanti)Joy (Shringara)Pathos (Karuna)Wonder (Adbhuta)Devotion (Bhakti)Humorous (Hasya)Heroic (Vira)',
      },
      {
        name: 'Bhairavi',
        alternate_spelling: 'Suddha Bhairavi',
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
        alternate_spelling: 'Bhankar',
        time: 'Morning',
      },
      {
        name: 'Bhankar Bhatiyari',
      },
      {
        name: 'Bhatiyar',
        alternate_spelling: 'Bhatiyari,',
        time: 'Early Morning',
        rasa: 'Devotion (Bhakti)Heroic (Vira)',
      },
      {
        name: 'Bhavani',
        alternate_spelling: 'Bhawani',
        time: 'Evening',
      },
      {
        name: 'Bhim',
        time: 'Late Afternoon',
      },
      {
        name: 'Bhimpalasri',
        alternate_spelling: 'Bhimpalashri',
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
        alternate_spelling: 'Bhupali Todi, Bhupal,',
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
        alternate_spelling: 'Bihagra',
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
        alternate_spelling: 'Bilaskhani,',
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
        alternate_spelling: 'Brindabani,',
        time: 'Early Afternoon, Mid-afternoon',
      },
      {
        name: 'Champak',
        time: 'Evening',
      },
      {
        name: 'Chanchalsas Malhar',
        alternate_spelling: 'Chanchalsas Ki Malhar,',
      },
      {
        name: 'Chandni Kedara',
        alternate_spelling: 'Chandini Kedar',
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
        alternate_spelling: 'Chandrakant Kalyan,',
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
        alternate_spelling: 'Chandrakaunsi Kanara',
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
        alternate_spelling: 'Charanashri',
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
        alternate_spelling: 'Chaya',
      },
      {
        name: 'Chhaya Kamodi Kalyan',
      },
      {
        name: 'Chhaya Tilak',
        alternate_spelling: 'Chaya Tilak',
        time: 'Evening',
      },
      {
        name: 'Chhayanat',
        alternate_spelling: 'Chayanat',
        time: 'Evening',
        rasa: 'Devotion (Bhakti)Peace (Shanti)Joy (Shringara)',
      },
      {
        name: 'Chitra Gauri',
        alternate_spelling: 'Chitra Gouri',
      },
      {
        name: 'Darbari Kanada',
        alternate_spelling: 'Darbari, Kanara Prakaar, Darbari Kanara',
        time: 'Late Evening',
      },
      {
        name: 'Darbari Todi',
        time: 'Morning',
        rasa: 'Pathos (Karuna)Devotion (Bhakti)',
      },
      {
        name: 'Deen Todi',
        alternate_spelling: 'Ahiri Todi, Bageshree Todi,Hira Todi,',
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
        alternate_spelling: 'Desi , Deshi',
        time: 'Late Morning',
      },
      {
        name: 'Deskar',
        alternate_spelling: 'Deshkar',
        time: 'Late Morning',
        rasa: 'Joy (Shringara)',
      },
      {
        name: 'Devgandhar',
        alternate_spelling: "Duigandhar-(2 ga's),",
        time: 'Late Morning, Early Afternoon',
        rasa: 'Joy (Shringara)Heroic (Vira)',
      },
      {
        name: 'Devgiri Bilawal',
        alternate_spelling: 'Devgiri,',
        time: 'Late Morning',
      },
      {
        name: 'Devranjani',
      },
      {
        name: 'Devsakh',
        alternate_spelling: 'Devsaga, Devsag',
        time: 'Late Morning, Early Afternoon',
      },
      {
        name: 'Dhanasri',
        alternate_spelling: 'Dhanashri',
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
        alternate_spelling: 'Dhawalasri',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Joy (Shringara)',
      },
      {
        name: 'Dhuliya Malhar',
        alternate_spelling: 'Dhulia Malhar',
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
        alternate_spelling: 'Durga Bhavani',
      },
      {
        name: 'Durga in Bilawal That',
        alternate_spelling: 'Durga,',
        time: 'Evening',
      },
      {
        name: 'Durga in Khammaj That',
        alternate_spelling: 'Durga,',
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
        alternate_spelling: 'Durgeshwari',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
      },
      {
        name: 'Ferozkhani Todi',
      },
      {
        name: 'Gandhari',
        alternate_spelling: 'Gandhar',
        time: 'Late Morning',
      },
      {
        name: 'Gandhari Todi',
        alternate_spelling: 'Jaunpuri\r\n, Gandhar Todi',
        time: 'Late Morning',
      },
      {
        name: 'Gara',
        time: 'Evening',
      },
      {
        name: 'Gara Kanada',
        alternate_spelling: 'Gara Kanara',
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
        alternate_spelling: 'Gaur Malhar',
      },
      {
        name: 'Gaud Sarang',
        alternate_spelling: 'Dinka Bihag\r\n, Gaur Sarang',
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
        alternate_spelling: 'Gopika Basant',
        time: 'Morning',
      },
      {
        name: 'Gorokh Kalyan',
        alternate_spelling: 'Gorak Kalyan, Gorakh Kalyan',
        time: 'Late Evening',
        rasa: 'Joy (Shringara)Pathos (Karuna)Detachment (Tyaga)',
      },
      {
        name: 'Gunji Kanada',
        alternate_spelling: 'Gunji Kanara',
        time: 'Night',
      },
      {
        name: 'Gunkali',
        alternate_spelling: 'Guna Kali',
        time: 'Early Morning',
      },
      {
        name: 'Gurjari Todi',
        alternate_spelling: 'Gurjari, Gujari Todi',
        time: 'Morning',
        rasa: 'Heroic (Vira)',
      },
      {
        name: 'Hambir',
        alternate_spelling: 'Hamir, Hamvir',
        time: 'Evening',
      },
      {
        name: 'Hansadwani',
        alternate_spelling: 'Hamsadhwani, Hangsadhwani',
        time: 'Evening',
        rasa: 'Heroic (Vira)Joy (Shringara)',
      },
      {
        name: 'Hansakankani',
        alternate_spelling: 'Hansakinkini',
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
        alternate_spelling: 'Husseni Kanara',
      },
      {
        name: 'Jait',
        alternate_spelling: 'Jayata,',
      },
      {
        name: 'Jait Kalyan',
        alternate_spelling: 'Jayath Kalyan, Jayati Kalyan',
        time: 'Evening',
      },
      {
        name: 'Jaitasri',
        alternate_spelling: 'Jaitsri',
      },
      {
        name: 'Jaladar Kedar',
        alternate_spelling: 'Jhaldhar Kedara',
        time: 'Late Night',
      },
      {
        name: 'Jangla Pilu',
        time: 'Evening',
      },
      {
        name: 'Jaunpuri',
        alternate_spelling: 'Jaunpuri Todi,',
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
        alternate_spelling: 'Jaijaiwanti',
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
        alternate_spelling: 'Jogia Kalingra',
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
        alternate_spelling: 'Kafi Kanara',
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
        alternate_spelling: 'Dhani Kaush, Koshik Dhani',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Devotion (Bhakti)Joy (Shringara)',
      },
      {
        name: 'Kaunsi Bhairav',
        alternate_spelling: 'Kaunsi Bhairo',
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
        alternate_spelling: 'Kaunsi Kanara',
        time: 'Late Evening',
      },
      {
        name: 'Kaunsi Sindh',
      },
      {
        name: 'Kaunsiki Bhairavi',
        alternate_spelling: 'Kaunsi Ki Bhairavi',
        time: 'Morning',
      },
      {
        name: 'Kaunsiki Todi',
        alternate_spelling: 'Kaunsi ki Todi',
      },
      {
        name: 'Kedara',
        alternate_spelling: 'Kedar, Kedar',
        time: 'Night',
        rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
      },
      {
        name: 'Khambavati',
        alternate_spelling: 'Khambawati',
        time: 'Midnight',
        rasa: 'Joy (Shringara)Pathos (Karuna)',
      },
      {
        name: 'Khambawati Kanada',
        alternate_spelling: 'Khambavati Kanara',
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
        alternate_spelling: 'Khammaji Kanara',
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
        alternate_spelling: 'Bengali Mand, Folk Tune',
      },
      {
        name: 'Kirwani',
        rasa: 'Joy (Shringara)Pathos (Karuna)',
      },
      {
        name: 'Kohal Kanada',
        alternate_spelling: 'Kohal Kanara',
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
        alternate_spelling: 'Laxshmi Ki Bhairavi',
        time: 'Morning',
      },
      {
        name: 'Lakshmi Todi',
        alternate_spelling: 'Laxshmi Todi',
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
        alternate_spelling: 'Lalit Bhatiyar',
      },
      {
        name: 'Lalita Gauri',
        time: 'Early Evening',
      },
      {
        name: 'Lankadahan Sarang',
        alternate_spelling: 'Lankadhan Saran, Lankadahan',
        time: 'Mid-afternoon',
      },
      {
        name: 'Latungi',
      },
      {
        name: 'Lom',
        alternate_spelling: 'Loom',
        time: 'Any time but early morning',
      },
      {
        name: 'Lom Bilawal',
      },
      {
        name: 'Lom Mand',
        alternate_spelling: 'Loom Mand',
      },
      {
        name: 'Lom Manj',
        alternate_spelling: 'Lome Manj',
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
        alternate_spelling: 'Madhumat Sarang',
        time: 'Early Afternoon',
      },
      {
        name: 'Madhumalati',
        time: 'Evening',
        rasa: 'Detachment (Tyaga)Devotion (Bhakti)Humorous (Hasya)Heroic (Vira)Joy (Shringara)Pathos (Karuna)Peace (Shanti)',
      },
      {
        name: 'Madhumalavi Kanada',
        alternate_spelling: 'Madhumalavi Kanara',
      },
      {
        name: 'Madhuwanti',
        alternate_spelling: 'Madhuvanti',
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
        alternate_spelling: 'Malinichand Kedara,',
      },
      {
        name: 'Maluha Gaur Malhar',
      },
      {
        name: 'Maluha Kalyan',
      },
      {
        name: 'Maluha Kedar',
        alternate_spelling: 'Maluha Kedara',
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
        alternate_spelling: 'Mangal Bhairo',
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
        alternate_spelling: 'Maru Hindola,',
      },
      {
        name: 'Marwa',
        time: 'Late Evening',
        rasa: 'Detachment (Tyaga)Heroic (Vira)Devotion (Bhakti)Peace (Shanti)Pathos (Karuna)',
      },
      {
        name: 'Mata Bhawani',
        alternate_spelling: 'Mata Bhavani',
      },
      {
        name: 'Medhabi',
        alternate_spelling: 'Medhavi',
        time: 'Evening',
      },
      {
        name: 'Megh Malhar',
        alternate_spelling: 'Megh',
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
        alternate_spelling: 'Miyan Malhar, Mian ki Malhar, Miyanh ki Malhaar',
        time: 'Evening, or anytime in rainy season but morning',
        rasa: 'Pathos (Karuna)Heroic (Vira)Joy (Shringara)',
      },
      {
        name: 'Miyan Ki Sarang',
        alternate_spelling: 'Mian Ki Sarang',
        time: 'Early Afternoon, Mid-afternoon',
        rasa: 'Devotion (Bhakti)Pathos (Karuna)',
      },
      {
        name: 'Miyan Ki Todi',
        alternate_spelling: 'Mian Ki Todi',
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
        alternate_spelling: 'Mudra Ki Kanara',
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
        alternate_spelling: 'Nat Bhairo',
        time: 'Dawn, Early Morning',
        rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
      },
      {
        name: 'Nat Bihag',
        time: 'Evening',
      },
      {
        name: 'Nat Bilawal',
        alternate_spelling: 'Nat Bilawali,',
        time: 'Late Morning',
      },
      {
        name: 'Nat Kuranjika',
        time: 'Middle of Night',
      },
      {
        name: 'Nat Lom',
        alternate_spelling: 'Nat Loom, Nat Lome',
      },
      {
        name: 'Nat Malhar',
      },
      {
        name: 'Nat Narayani Bhairav',
        alternate_spelling: 'Nat Narayani Bhairo',
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
        alternate_spelling: 'Nayaki Kanara',
        time: 'Late Evening',
      },
      {
        name: 'New Maihar Band I',
        rasa: 'Other',
      },
      {
        name: 'Pahadi',
        alternate_spelling: 'Pahari, Pohadi',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Joy (Shringara)',
      },
      {
        name: 'Pahadi Jhinjhoti',
        alternate_spelling: 'Pahari Jhinjhoti',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)',
      },
      {
        name: 'Palas Kafi',
        alternate_spelling: 'Palash Kafi',
        time: 'Afternoon',
      },
      {
        name: 'Palasi',
        alternate_spelling: 'Palash, Palas',
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
        alternate_spelling: 'Prabhat Bhairo, Parvat Bhairo',
      },
      {
        name: 'Pat Bihag',
        alternate_spelling: 'Pata Bihag',
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
        alternate_spelling: 'Patdeep',
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
        alternate_spelling: 'Jogi, Prava Kali',
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
        alternate_spelling: 'Pradipki, Pradeepaki, Patdipaki',
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
        alternate_spelling: 'Puriya Dhanashri',
        time: 'Early Evening',
        rasa: 'Pathos (Karuna)Peace (Shanti)Joy (Shringara)Devotion (Bhakti)Heroic (Vira)',
      },
      {
        name: 'Puriya Kalyan',
        alternate_spelling: 'Purva Kalyan, Purab Kalyan, Purav Kalyan',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Peace (Shanti)Joy (Shringara)Devotion (Bhakti)',
      },
      {
        name: 'Purvi',
        alternate_spelling: 'Purbi',
        time: 'Early Evening',
        rasa: 'Devotion (Bhakti)Peace (Shanti)',
      },
      {
        name: 'Purvi Kalyan',
        alternate_spelling: 'Purbi Kalyan',
        time: 'Dusk',
        rasa: 'Devotion (Bhakti)Pathos (Karuna)Peace (Shanti)',
      },
      {
        name: 'Rag Sagar',
      },
      {
        name: 'Ragesri',
        alternate_spelling: 'Rageshri, Rageshwari',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
      },
      {
        name: 'Rajesri',
        alternate_spelling: 'Rajeshri',
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
        alternate_spelling: 'Rasa Ranjani',
      },
      {
        name: 'Rupmanjari Malhar',
        alternate_spelling: 'Roop Manjari Malhar',
        time: 'Late Evening',
      },
      {
        name: 'Sahana',
        time: 'Midnight',
      },
      {
        name: 'Sahana Kanada',
        alternate_spelling: 'Sahana Kanara',
      },
      {
        name: 'Sajhgiri',
        alternate_spelling: 'Sadjagiri',
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
        alternate_spelling: 'Sarfarda,',
        time: 'Morning',
      },
      {
        name: 'Savani Kalyan',
        alternate_spelling: 'Sayani Kalyan',
        time: 'Evening',
      },
      {
        name: 'Shankara',
        alternate_spelling: 'Shankara Ragini,',
        time: 'Late Evening',
        rasa: 'Devotion (Bhakti)Heroic (Vira)',
      },
      {
        name: 'Shankara Bharan',
      },
      {
        name: 'Shankara Karan',
        alternate_spelling: 'Karan Shankara',
      },
      {
        name: 'Shivamat Bhairav',
        alternate_spelling: 'Shivamat Bhairo, Shiva Bhairav',
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
        alternate_spelling: 'Sindh Bhairavi, Sindhi Bhairavi',
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
        alternate_spelling: 'Surat',
        time: 'Evening',
        rasa: 'Pathos (Karuna)Joy (Shringara)Peace (Shanti)Devotion (Bhakti)',
      },
      {
        name: 'Sowrastra Tunka Bhairo',
        time: 'Morning',
      },
      {
        name: 'Sree Rag',
        alternate_spelling: 'Shree, Shri, Sri',
        time: 'Sunset',
        rasa: 'Devotion (Bhakti)Heroic (Vira)Pathos (Karuna)',
      },
      {
        name: 'Subhavati',
        time: 'Late Evening',
      },
      {
        name: 'Suddh Bhairavi',
        alternate_spelling: 'Shuddh Bhairavi',
        time: 'Morning',
      },
      {
        name: 'Suddh Kalyan',
        alternate_spelling: 'Shuddh Kalyan',
        time: 'Evening',
        rasa: 'Peace (Shanti)Devotion (Bhakti)',
      },
      {
        name: 'Suddh Sarang',
        alternate_spelling: 'Shuddh Sarang',
        time: 'Early Afternoon',
      },
      {
        name: 'Suddh Todi',
        alternate_spelling: 'Shuddh Todi',
        time: 'Morning',
      },
      {
        name: 'Sughrai',
        time: 'Afternoon, Night',
      },
      {
        name: 'Suha Kanada',
        alternate_spelling: 'Suha Kanara',
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
        alternate_spelling: 'Surdas Ki Malhar, Surmalhar',
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
        alternate_spelling: 'Bibhas',
        time: 'Late Morning',
        rasa: 'Devotion (Bhakti)Heroic (Vira)',
      },
      {
        name: 'Yaman',
        alternate_spelling: 'Yeman, Iman, Yemen',
        time: 'Night',
      },
      {
        name: 'Yaman Kalyan',
        alternate_spelling: 'Yeman Kalyan, Iman Kalyan, Yemen Kalyan',
        time: 'Evening',
        rasa: 'Devotion (Bhakti)Peace (Shanti)Pathos (Karuna)Joy (Shringara)',
      },
      {
        name: 'Yamni',
        alternate_spelling: 'Imni',
      },
      {
        name: 'Yamni Bilawal',
        alternate_spelling: 'Yaman Bilawal, Imni Bilawal',
        time: 'Morning',
      },
      {
        name: 'Zilla',
        alternate_spelling: 'Zila',
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
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('Ragas', null, {});
  },
};
