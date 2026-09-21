export const assignmentSinks = ['innerHTML', 'outerHTML', 'srcdoc'];

// Call sinks are banned even when tagged templates are allowed.
export const callSinks = [
  { property: 'insertAdjacentHTML' },
  { property: 'setHTMLUnsafe' },
  { object: 'document', property: 'write' },
  { object: 'document', property: 'writeln' },
];

const names = assignmentSinks.join('|');

export const anyAssignment = `AssignmentExpression[left.property.name=/^(${names})$/]`;

export const assignmentNotTaggedWith = (tag) =>
  `${anyAssignment}:not([right.tag.name='${tag}'])`;

export const banCalls = (message) => ({
  'no-restricted-properties': [
    'error',
    ...callSinks.map((sink) => ({ ...sink, message })),
  ],
});
