---
id: 1480
title: 'Simple React Drag and Drop'
date: '2021-04-11T15:00:15-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1480'
permalink: /2021/04/simple-react-drag-and-drop/
categories:
    - Javascript
tags:
    - 'Drag and Drop'
    - react
---

Up until recently I haven’t had the need to use drag and drop in my React projects. Then I did have the need. My need was simple, a list that could be reordered. I went searching for an example and everything I found just felt too complicated. I wasn’t worried about making it work. I was worried about having way too much boilerplate to reorder a list.

I decided on using [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd). It already is really simple, but I feel that it can easily be extended to be even simpler. Especially for simple use cases.

## Simple Draggable and Simple Droppable

Let’s look at an example that shows how simple and flexible we can make react-beautiful-dnd.

{{< codesandbox hungry-firefly-ljvjg >}}

Each list is drag and drop. There are multiple lists to demonstrate how flexible and easy it is to add another list. The examples use an unordered list, an ordered list, divs, and finally Material UI List Items.

First, let’s look at the helper Components `DroppableList` and `DraggableListItem.` These are there to help clean up the boilerplate and make sure that the correct props and refs are used. React-beautiful-dnd uses a Context, props, and refs to keep track of exactly what is going on when you are dragging and dropping items. This is very powerful and flexible. Except that you have to make sure you apply everything correctly. This adds some boilerplate code to everywhere you want to drag and drop.

Let’s first look at `DroppableList`.

```jsx
const DroppableList = ({
  children,
  as: Component = "ul",
  droppableId = "droppable",
  styleFn = (isDraggingOver) => ({}),
  ...props
}) => {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <Component
          {...props}
          {...provided.droppableProps}
          ref={provided.innerRef}
          style={styleFn(snapshot.isDraggingOver)}
        >
          {children}
          {provided.placeholder}
        </Component>
      )}
    </Droppable>
  );
};
```

Here we are asking for the prop to track which droppable area this is, `droppableId`. Next, a couple of items that help configure how it works, `as` and `styleFn`. And finally, two items that collect everything else `children` and `...props`.

I don’t want to get into a full breakdown of the react-beautiful-dnd library. The library does a great job of getting really in-depth. I will just highlight what makes this work.

We add the boilerplate `Droppable` component that wraps everything. Inside of that, we must supply a function that accepts provided and snapshot. Provided has the props, the ref, and a placeholder that is required by the library. We wire this all up so that we don’t have to do it every time.

Children and …props are there to collect everything else. Children will render everything that is inside of this element. Props will gather all the other attributes we pass in without having to explicitly name them. We pass them to the component that we are rendering. We will cover the as attribute shortly. Just know that by default this will render an unordered list (ul).

Now `DraggableListItem`.

```jsx
const DraggableListItem = ({
  children,
  as: Component = "li",
  draggableId,
  index,
  styleFn = (isDragging, draggableStyle) => ({ ...draggableStyle }),
  ...props
}) => {
  return (
    <Draggable draggableId={draggableId} index={index}>
      {(draggable, snapshot) => (
        <Component
          {...props}
          ref={draggable.innerRef}
          {...draggable.draggableProps}
          {...draggable.dragHandleProps}
          style={styleFn(snapshot.isDragging, draggable.draggableProps.style)}
        >
          {children}
        </Component>
      )}
    </Draggable>
  );
};
```

This is doing almost exactly the same thing except it uses `Draggable`. This has a little bit different boilerplate but is essentially doing the same thing. Setting up the element to be draggable.

## Using DroppableList and DraggableListItem

Now that we have the elements let’s put them together in a simple list.

```jsx
const SimpleList = ({
  initItems,
  listAs: Component = "ul",
  itemAs: ItemComponent = "li"
}) => {
  const [items, setItems] = React.useState(initItems);

  const handleDrop = (e) => {
    if (!e.destination) return;
    setItems(R.move(e.source.index, e.destination.index, items));
  };

  return (
    <DragDropContext onDragEnd={handleDrop}>
      <DroppableList as={Component}>
        {items.map((item, index) => (
          <DraggableListItem
            key={item}
            draggableId={item}
            index={index}
            as={ItemComponent}
          >
            {item}
          </DraggableListItem>
        ))}
      </DroppableList>
    </DragDropContext>
  );
};
```

Here is where we can start to see the simplicity of the other elements. We first must create a `DragDropContext`. We want to do this where the state is managed. This element is tracking the items so it is added here. `onDragEnd` will update the state when an item is dropped. We pass in the props to the Draggable item so we can keep track of which item is being dragged.

One quick highlight, R which is [ramda.js](https://ramdajs.com/), has `R.move` which is a simple way that moves an item in an array. It also does not mutate the current list so the result can be passed into setItems. I also pull ramda into everything I work on. It is a small functional toolkit.

### SimpleList in use

Here are some examples of `SimpleList`.

```jsx
//defined beforehand
const items = ["first", "second", "third", "fourth"];

<SimpleList initItems={items} />
<SimpleList initItems={items} listAs="ol" />
<SimpleList initItems={items} listAs="div" itemAs="div" />
```

Each of these will create a list that can be reordered. We will now look at the listAs and itemAs attributes. They work by utilizing the fact that lower case components names are mapped to HTML tags. <https://reactjs.org/docs/jsx-in-depth.html#user-defined-components-must-be-capitalized> This allows us to pass in any valid HTML tag as a lowercase string and React will render it as a component.

This is great, but what if we are using Material UI and need to use Material UI components. Well, let’s take a look.

```jsx
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import StarIcon from "@material-ui/icons/Star";
import ListItemText from "@material-ui/core/ListItemText";

const MaterialList = ({ initItems }) => {
  const [items, setItems] = React.useState(initItems);

  const handleDrop = (e) => {
    if (!e.destination) return;
    setItems(R.move(e.source.index, e.destination.index, items));
  };

  return (
    <DragDropContext onDragEnd={handleDrop}>
      <DroppableList
        as={List}
      >
        {items.map((item, index) => (
          <DraggableListItem
            key={item}
            draggableId={item}
            index={index}
            as={ListItem}
            styleFn={(isDrag, draggableStyles) => ({
              background: isDrag ? "grey" : "white",
              ...draggableStyles
            })}
          >
            <ListItemIcon>
              <StarIcon />
            </ListItemIcon>
            <ListItemText primary={item} secondary={index} />
          </DraggableListItem>
        ))}
      </DroppableList>
    </DragDropContext>
  );
};
```

More code, but not much more going on. Notice that DroppableList and DraggableListItem have the as attribute set to List and ListItem respectively. React will render that component for the list container and items. We are also doing more in DraggableListItem. We have an icon and text.

One final thing to note is that we define a styleFn. This will update the background to grey when the item is being dragged.

## Wrapping up Simple Examples of React Drag and Drop

https://codesandbox.io/s/hungry-firefly-ljvjg?file=/src/App.js

What if we wanted to drag between lists? We would wrap everything in one DragDropContext and add multiple DroppableLists with unique ids. Then we would update our function to handle updating the state.