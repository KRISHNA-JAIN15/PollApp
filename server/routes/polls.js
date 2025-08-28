const express = require("express");
const { body, validationResult } = require("express-validator");
const PollController = require("../controllers/pollController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const validateCreatePoll = [
  body("question").notEmpty().withMessage("Question is required"),
  body("options")
    .isArray({ min: 2 })
    .withMessage("At least 2 options are required"),
  body("options.*.text").notEmpty().withMessage("Option text cannot be empty"),
];

const validateVote = [
  body("optionId").isInt({ min: 1 }).withMessage("Valid option ID is required"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/",
  authenticateToken,
  validateCreatePoll,
  handleValidationErrors,
  PollController.createPoll
);

router.get("/", PollController.getAllPolls);

router.get("/:id", PollController.getPollById);

router.post(
  "/:id/vote",
  authenticateToken,
  validateVote,
  handleValidationErrors,
  PollController.votePoll
);

router.get("/:id/results", PollController.getPollResults);

router.get("/user/my-polls", authenticateToken, PollController.getUserPolls);

router.get("/user/my-votes", authenticateToken, PollController.getUserVotes);

router.delete("/:id", authenticateToken, PollController.deletePoll);

module.exports = router;
