---
layout: post
title: "Excel's ActivePane Index property bug and a workaround"
date: 2014-07-23 10:20:04 +0100
comments: true
description: A short description of a bug in the Excel object model. The ActivePane Index property does not work according to specification.
keywords: Excel, bug, ActivePane, index, vsto
categories: [Excel, excel bug, vsto]
---
In [Zebra BI][1] we are positioning our custom WPF forms on top of the Excel window in order to offer a richer and more contextual UI. Calculating the exact position for the forms is quite complex and painful, due to things like:

 - detecting the Excel window state and left edge position
 - calculating from points to pixels [^1]
 - coping with the Windows DPI
 - taking Ribbon / Formula Bar / Excel version into consideration
 - serious lack of events on many of Excel's objects
 - ...

The last nail in the coffin were the Panes which also need to be considered when a user uses the Freeze Panes option, which basically splits the worksheet into 2 or 4 Panes. At first it seemed like a simple adjustment until I started digging into the object model and ultimately found out that:
<!-- more -->

## ActivePane's Index property doesn't work correctly
According to the [Excel Object Model][2] specification the ActivePane property:
>Returns a **Pane** object that represents the **active pane** in the **window**.

and you can:
>Use the **Index** property to obtain the **index** of the **active pane**.


Here is a simple code that is used to display the index of the current ActivePane:


``` csharp
var window = Globals.ThisAddIn.Application.ActiveWindow;
var activePane = window.ActivePane;
MessageBox.Show(activePane.Index.ToString());
```

Let's see it in action.

{% img /img/ActivePane.gif 'ActivePane' 'ActivePane' %}

As you see when there are 2 panes it **always returns 2** and when we have 4 panes it **always returns 4**. I'm guessing it is just returning the number of the panes :)

## The workaround

I needed to determine in which of the Panes is the current selection so I started looking at the Panes members. The only promising one was the `VisibleRange`. I didn't want to use the Excel function `INTERSECT` since is quite costly performance wise. I figured out that just comparing the `Left` property of the `VisibleRange` with the `Left` property of the current selection should be enough (the same for the `Top` property). So I came up with this:
``` csharp
private int GetPaneIndex(){
    Range selection = Globals.ThisAddIn.Application.Selection;
    var window = Globals.ThisAddIn.Application.ActiveWindow;
    var paneCount = window.Panes.Count;
    if (paneCount == 2){
        Pane secondPane = window.Panes[2];
        if (secondPane.ScrollRow > 1 
          && secondPane.VisibleRange.Top < selection.Top)
            return 2;   
        if (secondPane.ScrollColumn > 1 
          && secondPane.VisibleRange.Left < selection.Left)
           return 2;   
    }
    else if (paneCount == 4){
        Pane secondPane = window.Panes[2];
        Pane thirdPane = window.Panes[3];
        if (selection.Left < secondPane.VisibleRange.Left 
          && selection.Top < thirdPane.VisibleRange.Top)
           return 1;
        if (selection.Left > secondPane.VisibleRange.Left 
          && selection.Top > thirdPane.VisibleRange.Top)
           return 4;
        if (selection.Left > secondPane.VisibleRange.Left )
           return 2;
        return 3;
     }
     return 1;
}
```
This works just fine with `Ranges` and pretty much every Excel object that has `Left` and `Top` properties. You get the correct index of the `ActivePane`.

However, what you also get, are some triggered events as soon as you access the VisibleRange property. I have no clue why this happens. Even a simple assigment like `var range = pane.VisibleRange;` causes the active chart to get deactivated, which again caused quite a few additional problems that are beyond the scope of this post.



[^1]: Since the `PointsToScreenPixels` method is bugged as well.

  [1]: http://zebra.bi/
  [2]: http://msdn.microsoft.com/en-us/library/office/microsoft.office.interop.excel.window.activepane%28v=office.15%29.aspx
