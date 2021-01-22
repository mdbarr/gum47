<template>
  <div>
    <galaxy />
  </div>
</template>

<script>
import state from '@/state';
import Galaxy from '@/components/Galaxy';

export default {
  name: 'Home',
  components: { Galaxy },
  data () {
    return { state };
  },
};
</script>
