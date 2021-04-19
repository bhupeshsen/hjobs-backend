const express = require('express');
const fs = require('fs');
const Plan = require('../models/plan');
const { GovtJob } = require('../models/govt-job');
const { Job } = require('../models/job');
const Blog = require('../models/blog');
const Feedback = require('../models/feedback');
const FAQ = require('../models/feedback');
const { User } = require('../models/user');
const router = express.Router();

router.get('/home', (req, res) => {
  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const lastDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 0, 0, 0);
  const _path = __dirname + '/../public/gallery';
  var images = [];

  Promise.all([
    // [0] Plan
    Plan.aggregate([
      {
        $facet: {
          user: [{ $match: { userType: 'user' } }, {
            $addFields: {
              finalPrice: {
                $cond: {
                  if: {
                    $eq: ['$discountPrice', 0]
                  },
                  then: '$originalPrice',
                  else: "$discountPrice"
                }
              }
            }
          },
          { $sort: { finalPrice: 1 } }],
          company: [{ $match: { userType: 'company' } }, {
            $addFields: {
              finalPrice: {
                $cond: {
                  if: {
                    $eq: ['$discountPrice', 0]
                  },
                  then: '$originalPrice',
                  else: "$discountPrice"
                }
              }
            }
          },
          { $sort: { finalPrice: 1 } }],
          resume: [{ $match: { userType: 'resume' } }, {
            $addFields: {
              finalPrice: {
                $cond: {
                  if: {
                    $eq: ['$discountPrice', 0]
                  },
                  then: '$originalPrice',
                  else: "$discountPrice"
                }
              }
            }
          },
          { $sort: { finalPrice: 1 } }],
          jobBranding: [{ $match: { userType: 'jobBranding' } }, {
            $addFields: {
              finalPrice: {
                $cond: {
                  if: {
                    $eq: ['$discountPrice', 0]
                  },
                  then: '$originalPrice',
                  else: "$discountPrice"
                }
              }
            }
          },
          { $sort: { finalPrice: 1 } }],
          provider: [{ $match: { userType: 'provider' } }, {
            $addFields: {
              finalPrice: {
                $cond: {
                  if: {
                    $eq: ['$discountPrice', 0]
                  },
                  then: '$originalPrice',
                  else: "$discountPrice"
                }
              }
            }
          },
          { $sort: { finalPrice: 1 } }],
          customer: [{ $match: { userType: 'customer' } }, {
            $addFields: {
              finalPrice: {
                $cond: {
                  if: {
                    $eq: ['$discountPrice', 0]
                  },
                  then: '$originalPrice',
                  else: "$discountPrice"
                }
              }
            }
          },
          { $sort: { finalPrice: 1 } }],
          hunar: [{ $match: { userType: 'hunar' } }, {
            $addFields: {
              finalPrice: {
                $cond: {
                  if: {
                    $eq: ['$discountPrice', 0]
                  },
                  then: '$originalPrice',
                  else: "$discountPrice"
                }
              }
            }
          },
          { $sort: { finalPrice: 1 } }],
        }
      },
    ]).exec(),
    // [1] Blog
    Blog.find({ published: true }, { description: 0 }).limit(6).exec(),
    // [2] Top Companies
    [{
      name: 'Snow Corporate',
      logo: `/images/company/snow-corp.png`,
      address: 'Sec-34, Rohini, North Delhi, Pin- 110039'
    }],
    // [3] Videos
    User.aggregate([
      { $match: { 'hunar.videos.status': 1 } },
      { $unwind: { path: '$hunar.videos', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, videos: { $addToSet: '$hunar.videos' } } },
      {
        $project: {
          videos: {
            $filter: {
              input: '$videos',
              as: 'video',
              cond: { $eq: ['$$video.status', 1] }
            }
          },
        }
      },
      { $unwind: { path: '$videos', preserveNullAndEmptyArrays: true } },
      { $limit: 6 },
      { $replaceRoot: { newRoot: '$videos' } }
    ]),
    // [4] Latest Jobs
    Job.find({ deadline: { $gte: newDate }, createdAt: { $gte: lastDate } },
      {
        title: 1, designation: 1, employmentType: 1,
        location: 1, skills: 1, salary: 1, deadline: 1, experience: 1
      }).populate('postedBy', 'name logo -_id').exec(),
    // [5] Gallery
    fs.readdirSync(_path).map(m => images.push(`gallery/${m}`)),
    // Count

  ]).then(data => {
    res.status(200).json({
      plans: data[0], blogs: data[1],
      topCompanies: data[2], videos: data[3],
      latestJobs: data[4], gallery: images,
      totalCount: {}
    });
  }).catch(err => {
    res.status(400).json(err);
  })
});

// Blogs
router.get('/blogs', (_, res) => {
  Blog.find({ published: true }, (err, results) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(results);
  });
});

router.get('/blog/:id', (req, res) => {
  const blogId = req.params.id;
  Blog.findById({ _id: blogId, published: true }, (err, results) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(results);
  });
});

/// Govt Jobs
router.route('/govt-jobs')
  .get((req, res) => {
    const today = new Date();
    const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const category = req.query.category;

    const query = category != undefined
      ? { category: category, deadline: { $gte: newDate } }
      : { deadline: { $gte: newDate } }

    GovtJob.find(query).sort({ createdAt: -1 }).exec((err, jobs) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(jobs);
    });
  });

/// Latest Jobs
router.get('/latest-jobs', (_, res) => {
  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const lastDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 0, 0, 0);

  Job.find({ deadline: { $gte: newDate }, createdAt: { $gte: lastDate } },
    {
      title: 1, designation: 1, employmentType: 1,
      location: 1, skills: 1, salary: 1, deadline: 1, experience: 1
    }).populate('postedBy', 'name logo -_id').exec((err, jobs) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(jobs);
    })
});

/// Plans
router.get('/plans', (_, res) => {
  Plan.aggregate([
    {
      $facet: {
        user: [{ $match: { userType: 'user' } }, {
          $addFields: {
            finalPrice: {
              $cond: {
                if: {
                  $eq: ['$discountPrice', 0]
                },
                then: '$originalPrice',
                else: "$discountPrice"
              }
            }
          }
        },
        { $sort: { finalPrice: 1 } }],
        company: [{ $match: { userType: 'company' } }, {
          $addFields: {
            finalPrice: {
              $cond: {
                if: {
                  $eq: ['$discountPrice', 0]
                },
                then: '$originalPrice',
                else: "$discountPrice"
              }
            }
          }
        },
        { $sort: { finalPrice: 1 } }],
        resume: [{ $match: { userType: 'resume' } }, {
          $addFields: {
            finalPrice: {
              $cond: {
                if: {
                  $eq: ['$discountPrice', 0]
                },
                then: '$originalPrice',
                else: "$discountPrice"
              }
            }
          }
        },
        { $sort: { finalPrice: 1 } }],
        jobBranding: [{ $match: { userType: 'jobBranding' } }, {
          $addFields: {
            finalPrice: {
              $cond: {
                if: {
                  $eq: ['$discountPrice', 0]
                },
                then: '$originalPrice',
                else: "$discountPrice"
              }
            }
          }
        },
        { $sort: { finalPrice: 1 } }],
        provider: [{ $match: { userType: 'provider' } }, {
          $addFields: {
            finalPrice: {
              $cond: {
                if: {
                  $eq: ['$discountPrice', 0]
                },
                then: '$originalPrice',
                else: "$discountPrice"
              }
            }
          }
        },
        { $sort: { finalPrice: 1 } }],
        customer: [{ $match: { userType: 'customer' } }, {
          $addFields: {
            finalPrice: {
              $cond: {
                if: {
                  $eq: ['$discountPrice', 0]
                },
                then: '$originalPrice',
                else: "$discountPrice"
              }
            }
          }
        },
        { $sort: { finalPrice: 1 } }],
        hunar: [{ $match: { userType: 'hunar' } }, {
          $addFields: {
            finalPrice: {
              $cond: {
                if: {
                  $eq: ['$discountPrice', 0]
                },
                then: '$originalPrice',
                else: "$discountPrice"
              }
            }
          }
        },
        { $sort: { finalPrice: 1 } }],
      }
    },
  ], (err, doc) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(doc);
  });
});

router.get('/plans/:user', (req, res) => {
  const user = req.params.user;
  Plan.aggregate([
    { $match: { userType: user } },
    {
      $addFields: {
        finalPrice: {
          $cond: {
            if: {
              $eq: ['$discountPrice', 0]
            },
            then: '$originalPrice',
            else: "$discountPrice"
          }
        }
      }
    },
    { $sort: { finalPrice: 1 } }
  ], (err, doc) => {
    if (err) return res.status(404).json({ message: 'not found!' })
    res.status(200).json(doc);
  });
});

router.get('/plan/:id', (req, res) => {
  const id = req.params.id;
  Plan.findById({ _id: id }, (err, doc) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(doc);
  });
});

/// Gallery
router.get('/promotions', (req, res) => {
  const _path = __dirname + '/../public/promotion';
  var images = [];

  fs.readdirSync(_path).map(m => images.push(`promotion/${m}`));
  res.status(200).json(images);
});

router.get('/gallery', (_, res) => {
  const _path = __dirname + '/../public/gallery';
  var images = [];

  fs.readdirSync(_path).map(m => images.push(`gallery/${m}`));
  res.status(200).json(images);
});

/// FAQ
router.get('/faq', (req, res) => {
  const type = req.query.type;
  const query = type != undefined ? { userType: type } : {};

  FAQ.find(query, (err, faqs) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(doc);
  });
});

/// Local Hunar Videos
router.get('/local-hunar-videos', (req, res) => {
  Job.aggregate([
    { $match: { 'hunar.videos.status': 1 } },
    { $unwind: { path: '$hunar.videos', preserveNullAndEmptyArrays: true } },
    { $group: { _id: null, videos: { $addToSet: '$hunar.videos' } } },
    {
      $project: {
        videos: {
          $filter: {
            input: '$videos',
            as: 'video',
            cond: { $eq: ['$$video.status', 1] }
          }
        },
      }
    },
    { $unwind: { path: '$videos', preserveNullAndEmptyArrays: true } },
    { $replaceRoot: { newRoot: '$videos' } }
  ]).exec((err, videos) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(videos);
  })
});

router.get('/top-companies', (req, res) => {
  res.status(200).json([{
    name: 'Snow Corporate',
    logo: `/images/company/snow-corp.png`,
    address: 'Sec-34, Rohini, North Delhi, Pin- 110039'
  }]);
});

/// Feedback
router.post('/feedback', (req, res) => {
  const body = req.body;
  const data = new Feedback(body);

  saveData(data, res);
});

module.exports = router;