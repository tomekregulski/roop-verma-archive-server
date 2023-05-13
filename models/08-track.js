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
    await queryInterface.bulkInsert(
      'Track',
      [
        {
          track_id: '1',
          tape_id: '1',
          raga_id: '54',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'good',
          master: false,
          media_type_id: '1',
          public: true,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1636225571/music/00001_ag4fgy.mp3',
        },
        {
          track_id: '2',
          tape_id: '1',
          raga_id: '213',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'good',
          master: false,
          media_type_id: '1',
          public: true,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045222/music/00002_blpoqs.mp3',
        },
        {
          track_id: '3',
          tape_id: '2',
          raga_id: '306',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'NOT OK; Rasa: Viraha and Union',
          audio_quality: 'poor',
          master: true,
          media_type_id: '1',
          public: true,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045635/music/00003_xo50fm.mp3',
        },
        {
          track_id: '4',
          tape_id: '2',
          raga_id: '72',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'OK; Rasa: Viraha and Bhakti',
          audio_quality: 'poor',
          master: true,
          media_type_id: '1',
          public: true,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045878/music/00004_qs35fm.mp3',
        },
        {
          track_id: '5',
          tape_id: '3',
          raga_id: '270',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: false,
          audio_quality: 'good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640063707/music/00005_kadp5e.mp3',
        },
        {
          track_id: '6',
          tape_id: '3',
          raga_id: '270',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: true,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640063714/music/00006_kspnkk.mp3',
        },
        {
          track_id: '7',
          tape_id: '4',
          raga_id: '235',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'good',
          master: false,
          media_type_id: '1',
          public: true,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045617/music/00007_nsjnnz.mp3',
        },
        {
          track_id: '8',
          tape_id: '4',
          raga_id: '137',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'good',
          master: false,
          media_type_id: '1',
          public: true,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045655/music/00008_iw2lzk.mp3',
        },
        {
          track_id: '9',
          tape_id: '5',
          raga_id: '213',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'poor',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045668/music/00009_zjkdbp.mp3',
        },
        {
          track_id: '10',
          tape_id: '5',
          raga_id: '103',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: true,
          medium_gat: false,
          fast_gat: false,
          accompanied: true,
          audio_quality: 'poor',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045578/music/00010_xwelro.mp3',
        },
        {
          track_id: '11',
          tape_id: '5',
          raga_id: '24',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: true,
          medium_gat: false,
          fast_gat: false,
          accompanied: true,
          audio_quality: 'poor',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045634/music/00011_tqcvvh.mp3',
        },
        {
          track_id: '12',
          tape_id: '5',
          raga_id: '103',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: true,
          fast_gat: false,
          accompanied: true,
          audio_quality: 'poor',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045538/music/00012_jbbnm4.mp3',
        },
        {
          track_id: '13',
          tape_id: '5',
          raga_id: '103',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: true,
          fast_gat: false,
          accompanied: true,
          notes: 'Dhun #3. Arjun notes: Resembles ragas Malgunji, Manjh Khamaj',
          audio_quality: 'poor',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1640045547/music/00013_zaersn.mp3',
        },
        {
          track_id: '14',
          tape_id: '6',
          raga_id: '356',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679448/music/00014_zcfnrq.mp3',
        },
        {
          track_id: '15',
          tape_id: '6',
          raga_id: '72',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679366/music/00015_us5mzf.mp3',
        },
        {
          track_id: '16',
          tape_id: '6',
          raga_id: '188',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679368/music/00016_y0ptll.mp3',
        },
        {
          track_id: '17',
          tape_id: '7',
          raga_id: '356',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679479/music/00017_l2bqih.mp3',
        },
        {
          track_id: '18',
          tape_id: '7',
          raga_id: '188',
          primary_artist_id: '1',
          alap: true,
          jor: false,
          jhalla: false,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679385/music/00018_dxyu1l.mp3',
        },
        {
          track_id: '19',
          tape_id: '8',
          raga_id: '178',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679327/music/00019_jizicf.mp3',
        },
        {
          track_id: '20',
          tape_id: '8',
          raga_id: '225',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679361/music/00020_ykotvg.mp3',
        },
        {
          track_id: '21',
          tape_id: '9',
          raga_id: '364',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679921/music/00021_evonla.mp3',
        },
        {
          track_id: '22',
          tape_id: '9',
          raga_id: '16',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679900/music/00022_lbg7ka.mp3',
        },
        {
          track_id: '23',
          tape_id: '10',
          raga_id: '128',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679877/music/00023_uhruod.mp3',
        },
        {
          track_id: '24',
          tape_id: '10',
          raga_id: '8',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650681293/music/00024_bnf66f.mp3',
        },
        {
          track_id: '25',
          tape_id: '11',
          raga_id: '302',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679930/music/00025_y8eqih.mp3',
        },
        {
          track_id: '26',
          tape_id: '11',
          raga_id: '188',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679837/music/00026_y2vnnt.mp3',
        },
        {
          track_id: '27',
          tape_id: '12',
          raga_id: '72',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679841/music/00027_eohbys.mp3',
        },
        {
          track_id: '28',
          tape_id: '13',
          raga_id: '55',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679851/music/00028_tonhm9.mp3',
        },
        {
          track_id: '29',
          tape_id: '13',
          raga_id: '78',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679861/music/00029_oh9bl3.mp3',
        },
        {
          track_id: '30',
          tape_id: '14',
          raga_id: '72',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Alap/Jor/Jhalla',
          audio_quality: "Need to figure out what's going on in this track",
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650679919/music/00030_zofjnk.mp3',
        },
        {
          track_id: '31',
          tape_id: '14',
          raga_id: '72',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          notes: 'Gat',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680467/music/00031_oo7adz.mp3',
        },
        {
          track_id: '32',
          tape_id: '14',
          raga_id: '366',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Alap/Jor/Jhalla',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680442/music/00032_itnrve.mp3',
        },
        {
          track_id: '33',
          tape_id: '14',
          raga_id: '366',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: true,
          fast_gat: false,
          accompanied: true,
          notes: 'Gat',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680423/music/00033_td44cq.mp3',
        },
        {
          track_id: '34',
          tape_id: '15',
          raga_id: '128',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680454/music/00034_jb6oww.mp3',
        },
        {
          track_id: '35',
          tape_id: '15',
          raga_id: '86',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680484/music/00035_mk7gkf.mp3',
        },
        {
          track_id: '36',
          tape_id: '16',
          raga_id: '197',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Swarmandala',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680465/music/00036_vulne6.mp3',
        },
        {
          track_id: '37',
          tape_id: '16',
          raga_id: '367',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'singing with tanpura',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680454/music/00037_vcis3o.mp3',
        },
        {
          track_id: '38',
          tape_id: '16',
          raga_id: '235',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Swarmandala',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680468/music/00038_n3bwcc.mp3',
        },
        {
          track_id: '39',
          tape_id: '17',
          raga_id: '239',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: '',
        },
        {
          track_id: '40',
          tape_id: '17',
          raga_id: '366',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: '',
        },
        {
          track_id: '41',
          tape_id: '18',
          raga_id: '368',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: true,
          fast_gat: true,
          accompanied: true,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650680477/music/00041_ltbatr.mp3',
        },
        {
          track_id: '42',
          tape_id: '18',
          raga_id: '363',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          master: false,
          media_type_id: '1',
          public: false,
          url: '',
        },
        {
          track_id: '43',
          tape_id: '19',
          raga_id: '356',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736016/music/00043_acsxsj.mp3',
        },
        {
          track_id: '44',
          tape_id: '19',
          raga_id: '363',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Tabla solo',
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650735925/music/00044_io337g.mp3',
        },
        {
          track_id: '45',
          tape_id: '19',
          raga_id: '159',
          primary_artist_id: '1',
          alap: true,
          jor: false,
          jhalla: false,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          notes: 'MAY NEED TO GET SPLIT UP',
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736054/music/00045_jb45h5.mp3',
        },
        {
          track_id: '46',
          tape_id: '19',
          raga_id: '103',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: '',
        },
        {
          track_id: '47',
          tape_id: '20',
          raga_id: '302',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736061/music/00047_fynt21.mp3',
        },
        {
          track_id: '48',
          tape_id: '20',
          raga_id: '72',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650735990/music/00048_eimof2.mp3',
        },
        {
          track_id: '49',
          tape_id: '21',
          raga_id: '302',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: true,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736066/music/00049_kqie4t.mp3',
        },
        {
          track_id: '50',
          tape_id: '22',
          raga_id: '279',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Chanting at the end',
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736039/music/00050_xekw36.mp3',
        },
        {
          track_id: '51',
          tape_id: '22',
          raga_id: '134',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Chanting at the end',
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737220/music/00051_rwoygx.mp3',
        },
        {
          track_id: '52',
          tape_id: '23',
          raga_id: '137',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737129/music/00052_wqerk2.mp3',
        },
        {
          track_id: '53',
          tape_id: '23',
          raga_id: '235',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737129/music/00052_wqerk2.mp3',
        },
        {
          track_id: '54',
          tape_id: '24',
          raga_id: '365',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Chanting Mantras',
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736935/music/00054_zknu0h.mp3',
        },
        {
          track_id: '55',
          tape_id: '24',
          raga_id: '54',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737241/music/00055_piwd00.mp3',
        },
        {
          track_id: '56',
          tape_id: '24',
          raga_id: '188',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737187/music/00056_cjakf7.mp3',
        },
        {
          track_id: '57',
          tape_id: '25',
          raga_id: '78',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737293/music/00057_o7jbih.mp3',
        },
        {
          track_id: '58',
          tape_id: '25',
          raga_id: '72',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737282/music/00058_jj0ym0.mp3',
        },
        {
          track_id: '59',
          tape_id: '26',
          raga_id: '356',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737267/music/00059_ia95ao.mp3',
        },
        {
          track_id: '60',
          tape_id: '26',
          raga_id: '235',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737197/music/00060_jkjeuc.mp3',
        },
        {
          track_id: '61',
          tape_id: '27',
          raga_id: '131',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: false,
          slow_gat: false,
          medium_gat: true,
          fast_gat: false,
          accompanied: true,
          notes: 'Confirm tape number correct',
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737073/music/00061_wo5ixx.mp3',
        },
        {
          track_id: '62',
          tape_id: '27',
          raga_id: '103',
          primary_artist_id: '1',
          alap: false,
          jor: false,
          jhalla: false,
          slow_gat: false,
          medium_gat: true,
          fast_gat: false,
          accompanied: true,
          notes: 'Confirm tape # correct',
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736919/music/00062_ojouel.mp3',
        },
        {
          track_id: '63',
          tape_id: '28',
          raga_id: '328',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737288/music/00063_wli0an.mp3',
        },
        {
          track_id: '64',
          tape_id: '28',
          raga_id: '8',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          notes: 'Sharing afterward',
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737305/music/00064_vy15h2.mp3',
        },
        {
          track_id: '65',
          tape_id: '29',
          raga_id: '75',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737183/music/00065_ksztiw.mp3',
        },
        {
          track_id: '66',
          tape_id: '29',
          raga_id: '75',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737088/music/00066_kmjqem.mp3',
        },
        {
          track_id: '67',
          tape_id: '29',
          raga_id: '103',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: true,
          fast_gat: false,
          accompanied: true,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650736929/music/00067_ohf3bn.mp3',
        },
        {
          track_id: '68',
          tape_id: '30',
          raga_id: '72',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737059/music/00068_jbwrby.mp3',
        },
        {
          track_id: '69',
          tape_id: '31',
          raga_id: '137',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737216/music/00069_emnlfu.mp3',
        },
        {
          track_id: '70',
          tape_id: '31',
          raga_id: '197',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737189/music/00070_rv33a8.mp3',
        },
        {
          track_id: '71',
          tape_id: '32',
          raga_id: '78',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Fair',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737285/music/00071_ugsxbj.mp3',
        },
        {
          track_id: '72',
          tape_id: '33',
          raga_id: '188',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737196/music/00072_gczsax.mp3',
        },
        {
          track_id: '73',
          tape_id: '34',
          raga_id: '302',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: true,
          fast_gat: true,
          accompanied: true,
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737274/music/00073_gncr6i.mp3',
        },
        {
          track_id: '74',
          tape_id: '34',
          raga_id: '188',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: true,
          medium_gat: false,
          fast_gat: true,
          accompanied: true,
          audio_quality: 'Good',
          master: false,
          media_type_id: '1',
          public: false,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1650737274/music/00074_rtvgmg.mp3',
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('Tracks', null, {});
  },
};