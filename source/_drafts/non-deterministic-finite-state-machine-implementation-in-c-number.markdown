---
layout: post
title: "Non-deterministic Finite State Machine implementation in C#"
published: false
comments: true
description: A simple implementation of non-deterministic finite state machine in C#.
keywords: c#, finite state machine, theory of computation
categories: [automata, theory of computation, c#, dotnet]
---

[Last time][2] I implemented the deterministic finite state machine (DFSM), and this time I will do the same for the non-deterministic (NDFSM) one. And to make it a bit more interesting I will go for the [NDFSM with `epsilon` transitions][1].

Let us consider what will change comparing to the DFSM case:

- we can have multiple transitions for a given state and symbol (I will refer to this by multiple transitions),
- `epsilon` (or empty symbol) acts similarly to the symbols from the alphabet, except that it does not need to be present in the input in order to use an `epsilon` transition (you can also picture this as the input imlicitly having any number of `epsilons` between the input symbols).

<!-- more -->

With multiple possible next moves and the *magic* `epsilon` transitions we get the non-deterministic way of operating. We need to guess the correct way to the solution. My first thought when seeing something like this is recursive backtracking:

- pick one of the possible transitions,
- if it leads to the solution great,
- if not backtrack and try something else.

But let us not get ahead of ourselves. Let us start with something simpler.

# Valid transitions
With the before discussed differences in mind I looked at the DFSM implementation to see what will I need to change (If you didn't read the [previous article][2] this would be a good time, since I will mostly skip the parts that will remain the same and only focus on the differences. And even if you have already read it, it might help to have another window opened with the [source code][3] of the solution.).

One of the first things I noticed was the logic that checks the validity of transitions. We will now have to allow multiple transitions and also transitions that use `epsilon` as a symbol. So we might change the `ValidTransition` like this:
``` csharp
public const char EPSILON = '\u03B5';

private bool ValidTransition(Transition transition){
    return  Q.Contains(transition.StartState) &&
            Q.Contains(transition.EndState) &&
            (Sigma.Contains(transition.Symbol) ||
            transition.Symbol == EPSILON);
}
```
I have introducted a constant char `EPSILON`, because we need a way to represent it for defining transitions. 

Which brings us to the biggest changes: the `Accepts` method.

# Non-deterministic accept

Like I already mentioned at the start of this post the non-determinism often looks like magic. Like there is some magic wand that guides the decisions of the automata. This kind of behavior is usually implemented by recursive backtracking. Let us look at a high level overview of the method:

- find all the posible transitions from the current state using the current symbol (do not forget the `epsilon` transitions!)
- select one transition and recursively try to accept the remaining input (in case of epsilon the remaining input stays the same)
- if we managed the accept the whole input and ended up in a final state, accept the input (if the state is not final try another `epsilon` transition)
- if the state is not final or no transitions are possible, backtrack and select a different transition


[1]: http://en.wikipedia.org/wiki/Nondeterministic_finite_automaton_with_%CE%B5-moves
[2]: http://bezensek.com/blog/2014/08/13/deterministic-finite-state-machine-implementation-in-c-number/
[3]: https://github.com/MitjaBezensek/DFSM/blob/master/FSM_Simple/DeterministicFSM.cs