---
layout: post
title: "Deterministic finite state machine minimization"
date: 2015-05-04 15:58:59 +0200
published: true
keywords: c#, finite state machine, theory of computation
categories: [automata, theory of computation, csharp, dotnet]
---

I have received a question about how to approach the topic of DFSM minimization and in this post I hope to answer that question.

## What is DFSM minimization
First, let us consider what does it mean for two DFSM to be **equivalent**? Imagine having two DFSM that both accept the same input symbols. You then pass all the possible inputs to those two machines and if their answers are the same for all the inputs then the two machines are equivalent. That is they accept exactly the same inputs, even though their inner workings (states and transitions) might not be the same.

This means that there are many equivalent DFSM. For example all three DFSM in Picture 1 accept the same input which can be written as a regular expression (0+1)<sup>*</sup>. 

{% img /img/Equivalence.png 'Deterministic finite state machine equivalence' 'Deterministic finite state machine equivalence' %}</br>

As you can see in the picture the three DFSM all have different number of states and also vary in the number of the transitions, but nonetheless I hope you will agree with me that they all accept the same input. 

<!-- more -->

In this example case the machines are simple. But what would happen if the machines were complex - how would we determine if they are equivalent? One way would be to generate all the possible inputs, feed them to the machines, and if their answers would be the same for all the inputs we could proclaim them equivalent. The problem is that the the machines can accept arbitrarily long inputs which means that this algorithm for equivalence would be highly inefficient [^1].

The answer is minimization which is a transformation of a machine into an equivalent machine that has minimum number of states.  If we minimize two DFSM we can easily check if they are equivalent (we just need to check if they have the same number of states and if all the transitions are the same).

## Why minimization (TODO maybe remove this paragraph?)
Like I desribed in the previous paragraph you can use minimization to check the equivalence of the DFSM. Two other benefits (when using DFSM in programming) are:

- performance increase due to less states and transitions (faster input checking, less memory consumed),
- easier reasoning about the minimized machine since it has fewer moving parts.

## Two types of states to remove
When minimizing there are [two types of states](http://en.wikipedia.org/wiki/DFA_minimization) of a DFSM that we can either completly remove from the machine or merge them with other states of the machine:

> - **unreachable states** are those states that are not reachable from the initial state of the DFA, for any input string,
> - **nondistinguishable states** are those that cannot be distinguished from one another for any input string.

## Unreachable states

First, let's look at an algorithm for finding the [unreachable states](http://en.wikipedia.org/wiki/DFA_minimization#Unreachable_states). The algorithm starts from the only known reachable state which is the start state - the start state is always reachable. It then expands the list of reachable states by adding all the states that can be reached from the start state. It continues this expansion using the newly added states until it cannot add any new states to the list of reachable states. The states of the DFSM that did not end up in the list of reachable states are unreachable.

To me this algorithm feels like flooding the pipes: we have a system of pipes some of which are connected and some of which are not. We open the water and check which pipes did the water reach and which it did not reach.

Below is the algorithm in C#[^2]:  
```csharp
var reachableStates = new HashSet<string>{Q0};
var newStates = new HashSet<string>{Q0};
do{
	var temp = new HashSet<string>();
	foreach (var q in newStates){
		foreach (var c in Sigma){
	        var transition = Delta.Find(t => t.StartState == q &&
                                             t.Symbol == c);
            if (transition != null){
	            temp.Add(transition.EndState);
            }
        }
    }
    temp.ExceptWith(reachableStates);
    newStates = temp;
    reachableStates.UnionWith(newStates);
} while (newStates.Count > 0);
var unreachableStates = Q.Where(q => !reachableStates.Contains(q));
```
The part of the algorithm that deals with finding the possible transitions from the new states is quite inefficient. For each new state it tries all the symbols from `sigma` which causes us to loop over all the transitions for every symbol and every new state. A better solution is presented below - we are just selecting all the states that are reachable from the current state:

```csharp
foreach (var q in newStates){
	var reachableFromQ = Delta.FindAll(t => t.StartState == q)
							  .Select(t => t.EndState);
    temp.UnionWith(reachableFromQ);
}
```

Now that we have found all the unreachable states we can remove them (along with transitions to and from them):

```csharp
for (int i = Delta.Count - 1; i >= 0; i--){
	var transition = Delta[i];
	if (unreachableStates.Contains(transition.EndState) ||
	    unreachableStates.Contains(transition.StartState)){
	    Delta.Remove(transition);
    }
}
foreach (var unreachableState in unreachableStates){
	Q.Remove(unreachableState);
}
```

## Nondistinguishable states

And now for the hard part - the nondistinguishable states. Here, we will use [Brzozowski's algorithm for minimization](http://en.wikipedia.org/wiki/DFA_minimization#Brzozowski.27s_algorithm) which uses the algorithm for unreachable states as one of its steps.

The algorithm works like this:

> Reversing the edges of a DFA produces a non-deterministic finite automaton (NFA) for the reversal of the original language, and converting this NFA to a DFA using the standard powerset construction (constructing only the reachable states of the converted DFA) leads to a minimal DFA for the same reversed language. Repeating this reversal operation a second time produces a minimal DFA for the original language.

In order to implement the described algorithm we will need the following:

1. an algorithm that reverses a DFSM and produces a corresponding NDFSM,
2. an algorithm for powerset construction (this algorithm converts a given NDFSM into an equivalent DFSM)
3. an algorithm for detecting and removing unreachable states (which we already have).

### Reversing a DFSM

The algorithm for reversing a DFSM is quite easy to implement and is presented below [^3]:
```csharp
private NDFSM Reverse(DFSM d){
	var delta = new List<Transition>();
    foreach (var transition in d.Delta) {
	    delta.Add(new Transition(transition.EndState, transition.Symbol, transition.StartState));
    }
    return new NDFSM(d.Q, d.Sigma, delta, d.F, d.Q0);
}
```

### Powerset construction
Like I discussed in my [previous blog post](http://bezensek.com/blog/2015/04/12/non-deterministic-finite-state-machine-implementation-in-c-number/), the only difference between DFSM and NDFSM is that the DFSM does not allow multiple transitions for a given state and symbol. If we wish to transform a NDFSM into a DFSM we need to remove these multiple transitions. We can achieve this by combining all the states that we can reach with a given symbol into a new state which is a set of all the reachable states. See the below picture for more info.

As you can see we can reach states `q1` and `q2` from the state `q0` using the symbol `a`. The powerset construction combines states `q1` and `q2` into a new state that is the set of these two states as can be seen on the picture. In the worst case our number of states explodes exponentially and we end up with the states that are all the possible subsets of our original set of states. Ouch.

Here is how we could implement the powerset constructions algorithm:


### Putting it all together
Now that we have all the pieces we can combine them into Brzozowski's  algorithm:


I needed to update the unreachable states algorithm so that it works even if there are multiple starting states. I only needed to changed the first two lines of the algorithm which sets the initial reachable and new states:

```csharp
public void MinimizeDFSM(DFSM fsm){
   var reversedNDFSM = Reverse(fsm);
   var reversedDFSM = PowerSet(reversedNDFSM);
   RemoveUnreachableStates(reversedDFSM);
   var NDFSM = Reverse(reversedDFSM);
   var DFSM = PowerSet(NDFSM);
   RemoveUnreachableStates(DFSM);
}
```

So this is it for minimizations. The source code can be found at github.


[^1]: We wouldn't need to check all the inputs since there are some properties of DFSM that could help us limit the length of the inputs we would need to try.

[^2]: You might want to check [one of my previous articles](http://bezensek.com/blog/2014/08/13/deterministic-finite-state-machine-implementation-in-c-number/) to check the DFSM implementation.

[^3]: If you read my previous article you might be wondering if those implementations will work with this reversal. The answer is no. The problem is that when we reverse a DFSM we are basically converting starting state to finish state and finish states to starting states. Which means there can be many starting states - a variant of the DFSM that my implementation does not cover. We will also need to take this into consideration for the algorithm for finding unreachable states.
