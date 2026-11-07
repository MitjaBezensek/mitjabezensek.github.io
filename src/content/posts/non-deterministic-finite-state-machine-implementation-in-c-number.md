---
title: "Non-deterministic Finite State Machine implementation in C#"
description: "A simple implementation of non-deterministic finite state machine in C#."
pubDate: "2015-04-12T22:35:00+02:00"
url: "/blog/2015/04/12/non-deterministic-finite-state-machine-implementation-in-c-number/"
categories: ["automata", "theory of computation", "csharp", "dotnet"]
comments: true
draft: false
---

[Last time][1] I implemented the deterministic finite state machine (DFSM). This time I will do the same for the non-deterministic (NDFSM) one. I chose the variation without the `epsilon` transitions and will leave that for exercise if someone might find it intriguing.

The only difference between the DFSM and NDFSM is that while the DFSM can only have a single transition for a given state and input symbol the NDFSM is not limited in that regard. It can have multiple transitions for a given state and input symbol.

<!-- more -->

With multiple possible next moves we get the non-deterministic way of operating. This is usualy depicted as a "magic wand" that correctly decides which transition to choose when multiple options are available. Unfortunatelly for us programmers we don't have that magic wand. We need to try all the possible options before we can answer wheater the NDFSM accepts the input or not. My first thought when seeing something like this is [backtracking][3]:

- pick one of the possible transitions,
- if it leads to the solution great,
- if not backtrack and try something else.

But let us not get ahead of ourselves. Let us start with something simpler.

## Valid transitions
With the before discussed difference in mind I looked at the DFSM implementation to see what will I need to change (If you didn't read the [previous article][1] this would be a good time, since I will mostly skip the parts that will remain the same and only focus on the differences. And even if you have already read it, it might help to have another window opened with the [source code][2] of the solution.).

One of the first things I noticed was the logic that checks the validity of transitions. We no longer need to check if a similar transition has already been defined, so we can remove that part:
``` csharp

private bool ValidTransition(Transition transition){
    return  Q.Contains(transition.StartState) &&
            Q.Contains(transition.EndState) &&
            Sigma.Contains(transition.Symbol);
}
```
All the other validation logic can remain the same. Which brings us to the biggest change: the `Accepts` method.

## Non-deterministic Accept

Like I already mentioned above the non-determinism often looks like magic. This kind of behavior is usually implemented by recursive backtracking. Let us look at a high level overview of the method:

- find all the posible transitions from the current state using the current symbol,
- recursively select one transition and try to accept the remaining input by using that transition,
- if we managed to read the whole input and ended up in a final state, accept the input,
- if the state is not final or no transitions are possible, backtrack and select a different transition.

First, we need a method that will start our recursive calls. The logic here is a bit different than in the deterministic case where we could easily determine if the input is not accepted: 

- there was no valid transition for current state and symbol symbol or 
- we read all the input and ended up in a non finite state. 

For the non-deterministic case we need to do that for all the possible transitions from a given state and symbol. And we should start this from the starting state and the whole input:
``` csharp
public void Accepts(string input){
    ConsoleWriter.Success("Trying to accept: " + input);

    if (Accepts(Q0, input, new StringBuilder())){
        return;
    }
    ConsoleWriter.Failure("Could not accept the input: " + input);
}
```
Next we need to write the recursive function that checks if there is any sequence of steps that leads from the current state to the final state using the specified input:
``` csharp
private bool Accepts(string currentState, string input, StringBuilder steps){
    if (input.Length > 0){
        var transitions = GetAllTransitions(currentState, input[0]);
        foreach (var transition in transitions){
            var currentSteps = new StringBuilder(steps.ToString() + transition);
            if (Accepts(transition.EndState, input.Substring(1), currentSteps)){
                return true;
            }
        }
        return false;
    }
    if (F.Contains(currentState)){
        ConsoleWriter.Success("Successfully accepted the input " + input + " " +
                               "in the final state " + currentState +
                               " with steps:\n" + steps);
        return true;
    }
    return false;
}
```

If there are more symbols to read we find all the possible transitions for the current state and current symbol. We then recursively try each of these transitions by calling the ```Acecepts``` method on the ```EndState``` of the transition with the remaining input. The remaining input here is the current input except for the first symbol which we used in the transition. We also need to add the current transition to the steps. For that I created a new ```StringBuilder``` or we would add some transitions that did not lead to the solution in the ```foreach``` loop.

The recursion stops when we either tried all the transitions and none of them worked. Or if we came to the end of the input in which case we accept the input only if we stoped in a finish state.

The only thing remaining is the ```GetAllTransitions``` method which simply goes through all transitions and finds the ones with the specified start state and symbol:

``` csharp
private IEnumerable<Transition> GetAllTransitions(string currentState, char symbol){
    return Delta.FindAll(t => t.StartState == currentState &&
                         t.Symbol == symbol);
}
```

## Conclusion
While the difference between the DFSM and NDFSM is quite small on paper their algorithms are quite different. Reading the input in the case of DFSM proceeds in linear fashion, we are always reducing the number of symbols we still need to read. But for NDFSM this is not the case. We might read all the input but not finish in the end state and then backtrack back to the begining with whole input left to read. This also makes the NDFSM algorithm perform much slower. 

Also the implementation above is not really the best when it comes to performance. We are calling the ```GetAllTransitions``` method over and over again. A better way would be to store the possible transitions so that we don't have go through all the transitions every time. But I'll leave this to the readers (as well as implementing [`epsilon` transitions][4]).

You can find the [source code][5] for NDFSM on github.


[1]: https://bezensek.com/blog/2014/08/13/deterministic-finite-state-machine-implementation-in-c-number/
[2]: https://github.com/MitjaBezensek/DFSM/blob/master/FSM_Simple/DeterministicFSM.cs
[3]: https://en.wikipedia.org/wiki/Backtracking
[4]: http://en.wikipedia.org/wiki/Nondeterministic_finite_automaton_with_%CE%B5-moves
[5]: https://github.com/MitjaBezensek/NDFSM
