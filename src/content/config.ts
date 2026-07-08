import { defineCollection, z } from 'astro:content';

const events = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['Workshop', 'Hackathon', 'Talk', 'Bootcamp', 'Showcase']),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string().optional(),
    timeLabel: z.string().optional(),
    endDate: z.string().optional(),
    location: z.string(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    status: z.enum(['Upcoming', 'Past', 'Registration Open', 'In Progress']),
    tags: z.array(z.string()),
    registrationUrl: z.string().url().optional(),
    summary: z.string()
  })
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    repo: z.string(),
    status: z.enum(['Active', 'Prototyping', 'Planning', 'Paused', 'Looking for Contributors', 'Completed']),
    order: z.number(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Intermediate-Advanced']),
    stack: z.array(z.string()),
    researchArea: z.string(),
    githubUrl: z.string().url(),
    docsUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    goodFirstIssues: z.boolean(),
    summary: z.string(),
    contributionNeeds: z.array(z.string())
  })
});

const research = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string().optional(),
    tags: z.array(z.string()),
    status: z.string().optional()
  })
});

export const collections = {
  events,
  projects,
  research
};
