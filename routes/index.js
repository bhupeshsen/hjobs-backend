const express = require('express');
const fs = require('fs');
const Plan = require('../models/plan');
const { GovtJob } = require('../models/govt-job');
const { Job } = require('../models/job');
const { Blog } = require('../models/blog');
const { Company } = require('../models/company');
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

  const filter = 'seeker.status recruiter.status customer.status provider.status hunar.status';

  Promise.all([
    // [0] Plan
    getPlans(),
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
    // [6] Count
    getCounts(),
    // [7] Govt Jobs
    getGovtJobs(req, 6),
    // [8] All Jobs
    getAllJobs(6),
    // [9] Top Companies
    getTopCompanies()
  ]).then(data => {
    res.status(200).json({
      plans: data[0], blogs: data[1],
      topCompanies: data[2], videos: data[3],
      latestJobs: data[4], gallery: images,
      totalCount: data[6][0],
      govtJobs: data[7], allJobs: data[8], topCompanies: data[9]
    });
  }).catch(err => {
    res.status(400).json(err);
  })
});

// Total Counts
router.get('/counts', async (req, res) => {
  const doc = await getCounts();
  res.status(200).json(doc[0]);
})

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
router.get('/govt-jobs', async (req, res) => {
  const jobs = await getGovtJobs(req, undefined);
  res.status(200).json(jobs);
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
    })
    .populate('postedBy', 'name logo -_id')
    .sort({ createdAt: -1 })
    .exec((err, jobs) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(jobs);
    })
});

/// Plans
router.get('/plans', async (_, res) => {
  const plans = await getPlans();
  res.status(200).json(plans);
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
    { $replaceRoot: { newRoot: '$videos' } }
  ]).exec((err, videos) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(videos);
  })
});

router.get('/top-companies', async (_, res) => {
  const recruiters = await getTopCompanies();
  res.status(200).json(recruiters);
});

router.get('/our-associates', (_, res) => {
  Company.find({}, 'name logo address').exec((err, companies) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(companies);
  });
});

/// All Jobs
router.get('/jobs', async (_, res) => {
  const jobs = await getAllJobs(undefined);
  res.status(200).json(jobs);
});

/// Search Job
router.get('/search-jobs', (req, res) => {
  const location = req.query.location;
  const keywords = req.query.keywords;

  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

  Job.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              { location: { $regex: '.*' + location + '.*', $options: 'i' } },
              {
                'boost.multiState': false, 'boost.expiryDate': { $gte: newDate },
                location: { $regex: '.*' + location + '.*', $options: 'i' }
              },
              {
                'boost.multiState': true, 'boost.expiryDate': { $gte: newDate },
                location: { $regex: '.*', $options: 'i' }
              },
            ]
          },
          {
            $or: [
              { skills: { $regex: '.*' + keywords + '.*', $options: 'i' } },
              { designation: { $regex: '.*' + keywords + '.*', $options: 'i' } }
            ]
          },
          { deadline: { $gte: newDate } }
        ]
      }
    },
    {
      $lookup: {
        from: Company.collection.name,
        let: { postedBy: '$postedBy', name: keywords },
        pipeline: [
          {
            $match: { $expr: { $eq: ['$_id', '$$postedBy'] } },
          },
          { $project: { name: 1, logo: 1 } }
        ],
        as: 'postedBy'
      }
    },
    { $unwind: { 'path': '$postedBy', 'preserveNullAndEmptyArrays': true } },
    { $project: { appliedBy: 0, hiredCandidates: 0, shortLists: 0, extraFields: 0 } },
    { $sort: { 'boost.expiryDate': -1 } },
  ], (err, doc) => {
    if (doc) {
      res.status(200).json(doc);
    } else {
      if (err) return res.status(400).json(err);
      res.status(204).json({ message: 'Content not available.' });
    }
  });
})

/// Feedback
router.post('/feedback', (req, res) => {
  const body = req.body;
  const data = new Feedback(body);

  saveData(data, res);
});

//
const getPlans = () => {
  return Plan.aggregate([
    {
      $facet: {
        user: [
          { $match: { userType: 'user' } }, {
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
        ],
        recruiter: [
          { $match: { userType: 'recruiter' } }, {
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
        ],
        resume: [
          { $match: { userType: 'resume' } }, {
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
        ],
        jobBranding: [
          { $match: { userType: 'jobBranding' } }, {
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
        ],
      }
    },
  ]);
}

const getCounts = () => {
  return User.aggregate([
    {
      $group: {
        _id: null,
        seeker: { $sum: { $cond: [{ $eq: ['$seeker.status', true] }, 1, 0] } },
        recruiter: { $sum: { $cond: [{ $eq: ['$recruiter.status', true] }, 1, 0] } },
        provider: { $sum: { $cond: [{ $eq: ['$provider.status', true] }, 1, 0] } },
        customer: { $sum: { $cond: [{ $eq: ['$customer.status', true] }, 1, 0] } },
        hunar: { $sum: { $cond: [{ $eq: ['$hunar.status', true] }, 1, 0] } }
      }
    },
    {
      $lookup: {
        from: Job.collection.name,
        pipeline: [
          { $count: 'count' },
        ],
        as: 'jobs'
      }
    },
    { $unwind: { path: '$jobs', preserveNullAndEmptyArrays: true } },
    {
      $project: { _id: 0, seeker: 1, recruiter: 1, provider: 1, customer: 1, hunar: 1, jobs: '$jobs.count' }
    }
  ]);
}

const getGovtJobs = (req, limit) => {
  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const category = req.query.category;

  const query = category != undefined
    ? { category: category, deadline: { $gte: newDate } }
    : { deadline: { $gte: newDate } }

  return GovtJob.find(query).sort({ createdAt: -1 }).limit(limit);
}

const getAllJobs = (limit) => {
  const filter = { hiredCandidates: 0, shortLists: 0, appliedBy: 0 };

  return Job.find({}, filter)
    .populate('postedBy', 'name logo')
    .sort({ createdAt: -1 })
    .limit(limit);
}

const getTopCompanies = () => {
  return User
    .find({ 'recruiter.addOnPlans.planType': 'jobBranding' }, '-_id recruiter.company')
    .populate('recruiter.company', 'name logo address');
}

module.exports = router;