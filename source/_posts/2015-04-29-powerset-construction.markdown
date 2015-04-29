---
layout: post
title: "Powerset construction"
date: 2015-04-29 22:41:59 +0200
comments: true
escription: An implementation of the powerset construction which converts NDFSM to DFSM
keywords: csharp, finite state machine, theory of computation
categories: [automata, theory of computation, csharp, dotnet]
---

In the last two articles I have implemented the [deterministic finite state machine](http://bezensek.com/blog/2014/08/13/deterministic-finite-state-machine-implementation-in-c-number/) (DFSM) and the [non-deterministic finite state machine](http://bezensek.com/blog/2015/04/12/non-deterministic-finite-state-machine-implementation-in-c-number/) (NDFSM). As you probably all know the two variants are equivalent in terms of power; that is everything that can be expressed with one can also be expressed with the other. This may come as a surprise when you first hear about it, but you are soon presented with the **[powerset construction](http://en.wikipedia.org/wiki/Powerset_construction)** which converts a NDFSM into a DFSM and thus proves one part of the equivalence. The other part is trivial since DFSM is only a limited NDFSM.

## Powerset construction algorithm

Like I discussed in my [previous blog post](http://bezensek.com/blog/2015/04/12/non-deterministic-finite-state-machine-implementation-in-c-number/), the only difference between the DFSM and the NDFSM is that the DFSM does not allow multiple transitions for a given state and symbol. If we wish to transform a NDFSM into a DFSM we need to remove these multiple transitions. We can achieve this by combining all the states that we can reach with a given symbol from a given state into a new state which is a set of all the reachable states. 

{% img /img/PowersetConstruction.png 'Powerset construction' 'Powerset construction' %}</br>

As you can see in the picture above we can reach states `q1` and `q2` from the state `q0` using the symbol `a`. The powerset construction combines states `q1` and `q2` into a new state that is the set of these two states as can be seen on the picture. The new state is denoted as `{q1, q2}`. In the worst case the number of states explodes exponentially and we end up with the states that are all the possible subsets of our original set of states. 

Ouch.

So how would we approach this constructions programmatically? Probably the easiest way would be to keep a queue of states that we wish to process. The initial queue would only contain the starting state. We would then add all the possible states that are reachable from the starting state. If there are multiple transitions from the starting state with a given symbol we would create a new *set state* like described in the previous paragraph and add it to the queue. For the symbols that only have one transition we would just add the ending state of the transition to the queue. We would then remove the starting state from the queue and repeat the described algorithm until we empty the queue.

During the execution of the algorithm we would of course need to keep track of the already processed states and the transitions between them so that we can construct our NDFSM.

Here is how the algorithm might look like:

```csharp
public static DFSM Convert(NDFSM nd){
   var Delta = new List<Transition>();
   var Q = new List<string>();
   var Q0 = new List<string>();
   var F = new List<string>();  
   var Sigma = nd.Sigma.ToList();
   var processed = new List<string>();
   var queue = new Queue<string>();
   
   foreach (var q0 in nd.Q0){
      queue.Enqueue(q0);
      Q0.Add(q0);
   }
   while (queue.Count > 0){
      var setState = queue.Dequeue();
      processed.Add(setState);
      Q.Add(setState);
      var statesInCurrentSetState = setState.Split(',').ToList();
      foreach (var state in statesInCurrentSetState){
         if (nd.F.Contains(state)){
            F.Add(setState);
            break;
         }
      }
      var symbols = nd.Delta.Where(t => statesInCurrentSetState.Contains(t.StartState)).Select(t => t.Symbol).Distinct();
      foreach (var symbol in symbols){
         var reachableStates =
            nd.Delta.Where(t => t.Symbol == symbol &&
                                statesInCurrentSetState.Contains(t.StartState))
               .OrderBy(t => t.EndState).Select(t => t.EndState);
         var reachableSetState = string.Join(",", reachableStates);
         Delta.Add(new Transition(setState, symbol, reachableSetState));
         if (!processed.Contains(reachableSetState)){
            queue.Enqueue(reachableSetState);
         }
      }
   }
   return new DFSM(Q, Sigma, Delta, Q0, F);
}
```