import express from 'express';

const router = express.Router();
import Idea from '../models/Idea.js'
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';

// @route GET    /api/ideas
// @description   Get all ideas
// @access        Public
// @query         _limit (optional limit for ideas  returned)
router.get('/', async (req, res, next) => {
  /*  
router.get('/', (req, res) => {
  const ideas = [
    { id: 1, title: 'Idea 1', description: 'Description for Idea 1' },
    { id: 2, title: 'Idea 2', description: 'Description for Idea 2' },
    { id: 3, title: 'Idea 3', description: 'Description for Idea 3' },
  ];
  res.json(ideas);
  */
  try {
    const limit = parseInt(req.query.limit); // optional limit
    const query = Idea.find().sort({ createdAt: -1 });  // sort descending
    console.log("limit", limit)

    if (!isNaN(limit)) {
      query.limit(limit);
    }
    
    const ideas = await query.exec();
    //const ideas = await Idea.find();
    res.json(ideas);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// @route GET    /api/ideas/:id
// @description   Get singe ideas
// @access        Public
router.get('/:id', async (req, res, next) => {
  /*  
router.get('/', (req, res) => {
  const ideas = [
    { id: 1, title: 'Idea 1', description: 'Description for Idea 1' },
    { id: 2, title: 'Idea 2', description: 'Description for Idea 2' },
    { id: 3, title: 'Idea 3', description: 'Description for Idea 3' },
  ];
  res.json(ideas);
  */
  try {
    const { id } = req.params;
    //const idea = await Idea.findById(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(404);
        throw new Error('Idea Not Found')
    }

    const idea = await Idea.findById(id);
    if (!idea) {
        res.status(404);
        throw new Error('Idea Not Found')
    }
    res.json(idea);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/*
// @route POST    /api/ideas
// @description   Create a new idea
// @access        Public
router.post('/', (req, res) => {
  //console.log(req.body)
  //res.send('processed')
  //const { title } = req.body || {};
  //res.send(title)

  const { title, description } = req.body || {};
  const newIdea = { id: Date.now(), title, description };
  //newIdea.id = Date.now(); // Simulate an ID for the new idea
  res.status(201).json(newIdea);
});
*/

// @route POST    /api/ideas
// @description   Create a new idea
// @access        Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, summary, description, tags } = req.body || {};

    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
        res.status(400);
        throw new Error('Title, Summary, and Description required.')
    }

    const newIdea = new Idea({
        title, summary, description, 
        tags: 
        typeof tags === 'string' ? 
          tags.split(',')
              .map((tag) => tag.trim())
              .filter(Boolean) : Array.isArray(tags) ? tags : [],
        user: req.user.id,
    })

    const savedIdea = await newIdea.save();
    res.status(201).json(savedIdea);
  } catch (err) {
    console.log(err);
    next(err);
  }

});

// @route GET    /api/ideas/:id
// @description   delete singe ideas
// @access        Private
router.delete('/:id', protect, async (req, res, next) => {
  /*  
router.get('/', (req, res) => {
  const ideas = [
    { id: 1, title: 'Idea 1', description: 'Description for Idea 1' },
    { id: 2, title: 'Idea 2', description: 'Description for Idea 2' },
    { id: 3, title: 'Idea 3', description: 'Description for Idea 3' },
  ];
  res.json(ideas);
  */
  try {
    const { id } = req.params;
    //const idea = await Idea.findById(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(404);
        throw new Error('Idea Not Found')
    }

    //const idea = await Idea.findByIdAndDelete(id);
    //if (!idea) {
    //    res.status(404);
    //    throw new Error('Idea Not Found')
    //}

    // find it and verify that it's owned by this user
    const idea = await Idea.findById(id);
    if (!idea) {
        res.status(404);
        throw new Error('Idea Not Found')
    }

    if (idea.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this idea')
    }

    await idea.deleteOne()
    res.json({message: "Idea successfully deleted"});
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// @route PUT     /api/ideas/:id
// @description   Update idea by ID
// @access        Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404);
      throw new Error('Idea not found');
    }

    // find it and verify that it's owned by this user
    const idea = await Idea.findById(id);
    if (!idea) {
        res.status(404);
        throw new Error('Idea Not Found')
    }

    if (idea.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this idea')
    }

    const { title, summary, description, tags } = req.body || {};

    if (!title || !summary || !description) {
      res.status(400);
      throw new Error('Title, summary, and description are required');
    }


    idea.title = title;
    idea.summary = summary;
    idea.description = description;
    idea.tags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];


    const updatedIdea = await idea.save();

    res.json(updatedIdea);

    /*
    const updatedIdea = await Idea.findByIdAndUpdate(
      id,
      {
        title,
        summary,
        description,
        tags: Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()),
      },
      { new: true, runValidators: true }  // if not there, add this as new and run the validators
    );

    if (!updatedIdea) {
      res.status(404);
      throw new Error('Idea not found');
    }
    res.json(updatedIdea);
    */
  } catch (err) {
    next(err);
  }
});

export default router;
