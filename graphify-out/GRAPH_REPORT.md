# Graph Report - /Users/carlosroberto/Workspace/Projetos/fullstack/fsc/bootcamp/treinos/bootcamp-treinos-api  (2026-04-30)

## Corpus Check
- 22 files · ~7,638 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 56 nodes · 86 edges · 10 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `GetHomeData` - 3 edges
2. `GetStats` - 3 edges
3. `NotFoundError` - 2 edges
4. `WorkoutPlanNotActiveError` - 2 edges
5. `SessionAlreadyStartedError` - 2 edges
6. `GetWorkoutPlan` - 2 edges
7. `UpdateWorkoutSession` - 2 edges
8. `UpsertUserTrainData` - 2 edges
9. `ListWorkoutPlans` - 2 edges
10. `StartWorkoutSession` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.27
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (3): CreateWorkoutPlan, GetUserTrainData, UpsertUserTrainData

### Community 2 - "Community 2"
Cohesion: 0.2
Nodes (4): GetWorkoutDay, NotFoundError, SessionAlreadyStartedError, WorkoutPlanNotActiveError

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (2): GetWorkoutPlan, UpdateWorkoutSession

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (1): GetHomeData

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (1): GetStats

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (1): ListWorkoutPlans

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (1): StartWorkoutSession

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 8`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._