export const components = [];

export const addComponent = ({ array, comp }) => {
    if (comp) components.push(comp);

    array.forEach(arr => {
        components.push(arr)
    });
}
