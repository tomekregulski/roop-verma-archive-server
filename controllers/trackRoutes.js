const router = require('express').Router();
const {
  Track,
  Tape,
  Location,
  Raga,
  Artist,
  TrackArtist,
  Event,
  MediaType,
  Category,
  TrackPlay,
} = require('../models');

const isValidJwt = require('../middleware/isValidJwt');

router.get('/', isValidJwt, async (req, res) => {
  try {
    const allTracks = await Track.findAll({
      include: [
        {
          model: Tape,
          as: 'tape',
          include: [
            {
              model: Event,
              as: 'event',
              include: [
                {
                  model: Location,
                  as: 'location',
                },
                {
                  model: Category,
                  as: 'category',
                },
              ],
            },
          ],
        },
        {
          model: MediaType,
          as: 'media_type',
        },
        {
          model: Raga,
          as: 'raga',
        },
        {
          model: Artist,
          as: 'artists',
          through: {
            model: TrackArtist,
          },
        },
      ],
    });
    const trackData = allTracks.map((track) => track.get({ plain: true }));
    res.status(200).json(trackData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get('/public', async (req, res) => {
  try {
    const allTracks = await Track.findAll({
      include: [
        {
          model: Tape,
          as: 'tape',
          include: [
            {
              model: Event,
              as: 'event',
              include: [
                {
                  model: Location,
                  as: 'location',
                },
              ],
            },
          ],
        },
        {
          model: MediaType,
          as: 'media_type',
        },
        {
          model: Raga,
          as: 'raga',
        },
        {
          model: Artist,
          as: 'artists',
          through: {
            model: TrackArtist,
          },
        },
      ],
      where: {
        public: true,
      },
    });
    const trackData = allTracks.map((track) => track.get({ plain: true }));
    res.status(200).json(trackData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.post('/track-plays', async (req, res) => {
  try {
    const newTrackPlay = await TrackPlay.create({
      user_id: req.body.userId,
      track_id: req.body.trackId,
      seconds_listened: req.body.secondsListened,
    });

    res.status(200).json(newTrackPlay);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

module.exports = router;
