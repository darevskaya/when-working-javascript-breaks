// The markup sinks that Trusted Types guards. A string in any of these throws
// on a page that sends require-trusted-types-for 'script'. The three lint
// configurations in this folder share this one list.

// Sinks you assign to: element.innerHTML = value.
export const assignmentSinks = ['innerHTML', 'outerHTML', 'srcdoc'];

// Sinks you call: element.insertAdjacentHTML(...), document.write(...). No
// configuration here allows any of them, because a call carries no tag that a
// rule can look for.
export const callSinks = [
  { property: 'insertAdjacentHTML' },
  { property: 'setHTMLUnsafe' },
  { object: 'document', property: 'write' },
  { object: 'document', property: 'writeln' },
];

const names = assignmentSinks.join('|');

// Every assignment to a markup sink.
export const anyAssignment = `AssignmentExpression[left.property.name=/^(${names})$/]`;

// Every assignment to a markup sink whose value does not come from the tagged
// template that the configuration allows.
export const assignmentNotTaggedWith = (tag) =>
  `${anyAssignment}:not([right.tag.name='${tag}'])`;

export const banCalls = (message) => ({
  'no-restricted-properties': [
    'error',
    ...callSinks.map((sink) => ({ ...sink, message })),
  ],
});
